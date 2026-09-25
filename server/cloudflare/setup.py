"""
guber.uz uchun Cloudflare'ni avtomatik sozlash.

Ishga tushirish (server papkasida):  docker compose run --rm cf-setup

Nima qiladi:
  1. Tunnel yaratadi (yoki borini ishlatadi) va uni web konteyneriga yo'naltiradi
  2. DNS: domen va www -> tunnel (proxied)
  3. "Verify you are human" chiqmasligi uchun: Security Level, Browser Integrity Check,
     Bot Fight Mode o'chiriladi; O'zbekiston IP'lari uchun WAF "skip" qoidasi qo'shiladi
  4. Tunnel tokenini .env fayliga yozadi

Faqat Python standart kutubxonasi ishlatiladi. Qayta ishga tushirsa bo'ladi.
"""
import getpass
import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.cloudflare.com/client/v4"
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
TUNNEL_NAME = "guber-noutbuk"
ORIGIN = "http://web:80"
UZ_RULE_DESC = "guber: O'zbekiston mehmonlariga tekshiruv chiqarmaslik"


class CFError(Exception):
    pass


def read_env():
    env = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env


def write_env(updates):
    lines = []
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, encoding="utf-8") as f:
            lines = f.read().splitlines()
    done = set()
    for i, line in enumerate(lines):
        key = line.split("=", 1)[0].strip()
        if key in updates and not line.lstrip().startswith("#"):
            lines[i] = f"{key}={updates[key]}"
            done.add(key)
    for key, val in updates.items():
        if key not in done:
            lines.append(f"{key}={val}")
    # Mavjud faylni qayta yozamiz (egasi o'zgarmasin)
    with open(ENV_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def call(token, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            payload = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode())
        except Exception:
            raise CFError(f"HTTP {e.code} {path}")
    if not payload.get("success"):
        msgs = "; ".join(f"[{x.get('code')}] {x.get('message')}" for x in payload.get("errors", []))
        raise CFError(msgs or f"xato: {path}")
    return payload.get("result")


def ask_yes(question):
    ans = input(f"{question} (ha/yo'q): ").strip().lower()
    return ans in ("ha", "h", "yes", "y")


def ok(msg):
    print(f"  ✅ {msg}")


def warn(msg):
    print(f"  ⚠️  {msg}")


def main():
    env = read_env()
    domain = (env.get("DOMAIN") or "guber.uz").lower()
    print(f"\n=== Cloudflare sozlash: {domain} ===\n")

    token = os.environ.get("CF_API_TOKEN") or getpass.getpass(
        "Cloudflare API tokenini joylang (ekranda ko'rinmaydi): "
    ).strip()
    if not token:
        sys.exit("Token kiritilmadi.")

    # 1. Token va zona
    print("1) Token va domen tekshirilmoqda...")
    call(token, "GET", "/user/tokens/verify")
    zones = call(token, "GET", f"/zones?name={domain}")
    if not zones:
        sys.exit(
            f"  ❌ {domain} Cloudflare'da topilmadi. Avval domenni Cloudflare'ga qo'shing "
            "(QOLLANMA.md, 2-qadam) va token shu domenga ruxsat berganini tekshiring."
        )
    zone = zones[0]
    zone_id, account_id = zone["id"], zone["account"]["id"]
    if zone.get("status") != "active":
        warn(
            f"Domen holati: '{zone.get('status')}'. NS serverlar hali o'zgarmagan bo'lishi mumkin — "
            "sozlamalar baribir yoziladi, NS o'tgach sayt ochiladi."
        )
    ok(f"Domen topildi (holati: {zone.get('status')})")

    # 2. Tunnel
    print("2) Tunnel...")
    tunnels = call(token, "GET", f"/accounts/{account_id}/cfd_tunnel?name={TUNNEL_NAME}&is_deleted=false")
    if tunnels:
        tunnel_id = tunnels[0]["id"]
        ok(f"Mavjud tunnel ishlatiladi: {TUNNEL_NAME}")
    else:
        t = call(token, "POST", f"/accounts/{account_id}/cfd_tunnel",
                 {"name": TUNNEL_NAME, "config_src": "cloudflare"})
        tunnel_id = t["id"]
        ok(f"Tunnel yaratildi: {TUNNEL_NAME}")

    hosts = [domain, f"www.{domain}"]
    ingress = [{"hostname": h, "service": ORIGIN} for h in hosts] + [{"service": "http_status:404"}]
    call(token, "PUT", f"/accounts/{account_id}/cfd_tunnel/{tunnel_id}/configurations",
         {"config": {"ingress": ingress}})
    ok(f"Tunnel yo'naltirildi: {', '.join(hosts)} -> {ORIGIN}")
    tunnel_token = call(token, "GET", f"/accounts/{account_id}/cfd_tunnel/{tunnel_id}/token")

    # 3. DNS
    print("3) DNS yozuvlari...")
    target = f"{tunnel_id}.cfargotunnel.com"
    for host in hosts:
        records = call(token, "GET", f"/zones/{zone_id}/dns_records?name={host}")
        records = [r for r in records if r["type"] in ("A", "AAAA", "CNAME")]
        if any(r["type"] == "CNAME" and r["content"] == target for r in records):
            ok(f"{host} allaqachon tunnelga ulangan")
            continue
        if records:
            print(f"\n  {host} uchun hozirgi yozuvlar (sayt hozir shu yerda ishlayapti):")
            for r in records:
                print(f"    {r['type']:5} {r['content']}")
            if not ask_yes(f"  Ularni o'chirib, {host} ni noutbukka yo'naltiraymi?"):
                warn(f"{host} o'zgartirilmadi")
                continue
            for r in records:
                call(token, "DELETE", f"/zones/{zone_id}/dns_records/{r['id']}")
        call(token, "POST", f"/zones/{zone_id}/dns_records",
             {"type": "CNAME", "name": host, "content": target, "proxied": True,
              "comment": "guber noutbuk tunnel"})
        ok(f"{host} -> tunnel")

    # 4. "Verify you are human" chiqmasligi
    print("4) Himoya sozlamalari (odamlarga tekshiruv chiqmasin)...")
    settings = [
        ("security_level", "essentially_off", "Security Level: Essentially Off"),
        ("browser_check", "off", "Browser Integrity Check: o'chirildi"),
        ("always_use_https", "on", "Always Use HTTPS: yoqildi"),
    ]
    for key, value, label in settings:
        try:
            call(token, "PATCH", f"/zones/{zone_id}/settings/{key}", {"value": value})
            ok(label)
        except CFError as e:
            warn(f"{label} — bo'lmadi ({e}). Qo'lda qiling: QOLLANMA.md, 5-qadam")

    try:
        call(token, "PUT", f"/zones/{zone_id}/bot_management", {"fight_mode": False})
        ok("Bot Fight Mode: o'chirildi")
    except CFError as e:
        warn(f"Bot Fight Mode — bo'lmadi ({e}). Qo'lda: Security → Bots → Bot Fight Mode = Off")

    add_uz_skip_rule(token, zone_id)

    # 5. .env
    write_env({"CF_TUNNEL_TOKEN": tunnel_token, "COMPOSE_PROFILES": "tunnel"})
    ok(".env fayliga tunnel tokeni yozildi")

    print(
        "\n🎉 Tayyor! Endi serverni ishga tushiring:\n"
        "     docker compose up -d\n"
        f"   1–2 daqiqadan so'ng https://{domain} ochiladi.\n"
    )


def add_uz_skip_rule(token, zone_id):
    phase = f"/zones/{zone_id}/rulesets/phases/http_request_firewall_custom/entrypoint"
    base = {"expression": '(ip.src.country eq "UZ")', "description": UZ_RULE_DESC,
            "action": "skip", "enabled": True}
    products = ["bic", "hot", "securityLevel", "uaBlock", "zoneLockdown", "waf"]
    variants = [
        {"ruleset": "current", "phases": ["http_ratelimit", "http_request_firewall_managed"],
         "products": products},
        {"ruleset": "current", "products": products},
    ]
    try:
        entry = call(token, "GET", phase)
    except CFError:
        entry = None
    if entry and any(r.get("description") == UZ_RULE_DESC for r in entry.get("rules", [])):
        ok("WAF: O'zbekiston uchun skip qoidasi allaqachon bor")
        return
    last = None
    for params in variants:
        rule = dict(base, action_parameters=params)
        try:
            if entry:
                call(token, "POST", f"/zones/{zone_id}/rulesets/{entry['id']}/rules", rule)
            else:
                call(token, "PUT", phase, {"rules": [rule]})
            ok("WAF: O'zbekiston IP'lari uchun tekshiruvlar o'tkazib yuboriladi")
            return
        except CFError as e:
            last = e
    warn(f"WAF qoidasi qo'shilmadi ({last}). Qo'lda qiling: QOLLANMA.md, 5-qadam")


if __name__ == "__main__":
    try:
        main()
    except CFError as e:
        sys.exit(
            f"\n  ❌ Cloudflare xatosi: {e}\n"
            "  Token ruxsatlarini tekshiring (QOLLANMA.md, 3-qadam) va qayta urinib ko'ring."
        )
    except KeyboardInterrupt:
        sys.exit("\nTo'xtatildi.")
