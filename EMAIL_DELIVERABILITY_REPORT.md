# Email Deliverability Report — v1.2.3

## Current Configuration

| Setting | Recommendation |
|---------|----------------|
| SPF | Publish SPF record authorizing Gmail/Vercel relay sending IP |
| DKIM | Enable DKIM signing on Gmail Workspace or relay provider |
| DMARC | `v=DMARC1; p=quarantine; rua=mailto:dmarc@wilms.org` |
| From | `WILMS - GH <noreply@wilms.org>` via `format-from.ts` |
| Reply-To | `support@wilms.org` in transactional templates |
| Return-Path | Align with SPF domain |
| List-Unsubscribe | Include on marketing/broadcast emails |
| Message-ID | Generated per send in mail dispatch |
| Multipart | HTML + plain text in all templates |

## DNS Records (example)

```
TXT @ "v=spf1 include:_spf.google.com ~all"
TXT default._domainkey "v=DKIM1; k=rsa; p=<public-key>"
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@wilms.org"
```

## Content Practices

- WILMS branded responsive templates with logo and footer
- Avoid spam trigger phrases in subject lines
- Host images on production CDN/domain
- Use consistent link domains matching SPF/DKIM domain

## Monitoring

Track bounces and complaints via `message_deliveries.bouncedAt` / `complainedAt` and Communication Center delivery reports.
