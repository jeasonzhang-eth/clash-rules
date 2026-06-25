# 规则集清单（自有 clash-rules）

> 由 `inventory.sh` 自动生成，覆盖 `used-rulesets.txt` 中 override.js 实际引用的规则集。
> 重新生成：`bash inventory.sh`

| 规则集 | 文件 | 条目数 | 规则类型 | 首行注释 |
|--------|------|-------:|----------|----------|
| ABC | `Clash/Provider/Media/ABC.yaml` | 2 |   - DOMAIN-SUFFIX |   # > ABC |
| Abema TV | `Clash/Provider/Media/Abema TV.yaml` | 14 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > AbemaTV |
| Amazon | `Clash/Provider/Media/Amazon.yaml` | 19 |   - DOMAIN/  - DOMAIN-SUFFIX |   # > Amazon Prime Video |
| Apple | `Clash/Provider/Apple.yaml` | 27 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - IP-CIDR/  - PROCESS-NAME |   # > Apple API |
| Apple Music | `Clash/Provider/Media/Apple Music.yaml` | 10 |   - DOMAIN/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Apple Music |
| Apple News | `Clash/Provider/Media/Apple News.yaml` | 1 |   - DOMAIN |   # > Apple News and Apple Map TOMTOM Version |
| Apple TV | `Clash/Provider/Media/Apple TV.yaml` | 4 |   - DOMAIN/  - DOMAIN-SUFFIX |   # > Apple TV |
| BBC iPlayer | `Clash/Provider/Media/BBC iPlayer.yaml` | 10 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > BBC iPlayer |
| Bahamut | `Clash/Provider/Media/Bahamut.yaml` | 6 |   - DOMAIN/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Bahamut |
| Bilibili | `Clash/Provider/Media/Bilibili.yaml` | 17 |   - DOMAIN/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Bilibili |
| Crypto | `Clash/Provider/Crypto.yaml` | 253 |   - DOMAIN/  - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Forum |
| DAZN | `Clash/Provider/Media/DAZN.yaml` | 12 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > DAZN |
| Discord | `Clash/Provider/Discord.yaml` | 6 |   - DOMAIN-SUFFIX |  > Discord |
| Discovery Plus | `Clash/Provider/Media/Discovery Plus.yaml` | 9 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Discovery Plus |
| Disney Plus | `Clash/Provider/Media/Disney Plus.yaml` | 9 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Disney Plus |
| Domestic | `Clash/Provider/Domestic.yaml` | 283 |   - DOMAIN/  - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - IP-CIDR/  - IP-CIDR6 |   # China Banks |
| Domestic IPs | `Clash/Provider/Domestic IPs.yaml` | 8956 |   - IP-CIDR/  - IP-CIDR6 |  > WeChat's IPs |
| F1 TV | `Clash/Provider/Media/F1 TV.yaml` | 8 |   - DOMAIN/  - DOMAIN-SUFFIX |   # > F1 TV |
| Fox Now | `Clash/Provider/Media/Fox Now.yaml` | 3 |   - DOMAIN-SUFFIX |   # > Fox Now |
| Fox+ | `Clash/Provider/Media/Fox+.yaml` | 3 |   - DOMAIN-SUFFIX |   # > Fox+ (HK\|TW\|SG) |
| Google FCM | `Clash/Provider/Google FCM.yaml` | 41 |   - DOMAIN/  - IP-CIDR |   # > Google FCM |
| Max | `Clash/Provider/Media/Max.yaml` | 17 |   - DOMAIN/  - DOMAIN-SUFFIX |   # > Max |
| Hulu | `Clash/Provider/Media/Hulu.yaml` | 18 |   - DOMAIN/  - DOMAIN-SUFFIX/  - IP-CIDR/  - IP-CIDR6/  - PROCESS-NAME |   # > Hulu |
| Hulu Japan | `Clash/Provider/Media/Hulu Japan.yaml` | 6 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Hulu(フールー) |
| IQ | `Clash/Provider/Media/IQ.yaml` | 19 |   - DOMAIN/  - DOMAIN-SUFFIX/  - IP-CIDR |  |
| IQIYI | `Clash/Provider/Media/IQIYI.yaml` | 34 |   - DOMAIN-SUFFIX |   # > IQIYI |
| JOOX | `Clash/Provider/Media/JOOX.yaml` | 4 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > JOOX |
| Japonx | `Clash/Provider/Media/Japonx.yaml` | 10 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX |   # > Japonx |
| KKBOX | `Clash/Provider/Media/KKBOX.yaml` | 3 |   - DOMAIN-SUFFIX |   # > KKBOX |
| KKTV | `Clash/Provider/Media/KKTV.yaml` | 4 |   - DOMAIN/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > KKTV |
| LAN | `Clash/Provider/LAN.yaml` | 8 |   - DOMAIN-SUFFIX/  - IP-CIDR/  - IP-CIDR6 |  |
| Letv | `Clash/Provider/Media/Letv.yaml` | 1 |   - DOMAIN-SUFFIX |   # > letv |
| Line TV | `Clash/Provider/Media/Line TV.yaml` | 3 |   - DOMAIN-SUFFIX |   # > Line TV |
| Microsoft | `Clash/Provider/Microsoft.yaml` | 589 |   - DOMAIN-SUFFIX |   # > Microsoft |
| Netease Music | `Clash/Provider/Media/Netease Music.yaml` | 2 |   - DOMAIN-SUFFIX |   # > Netease Music |
| Netflix | `Clash/Provider/Media/Netflix.yaml` | 7 |   - DOMAIN-SUFFIX |   # > Netflix |
| Niconico | `Clash/Provider/Media/Niconico.yaml` | 9 |   - DOMAIN-SUFFIX |   # > Niconico |
| AI Suite | `Clash/Provider/AI Suite.yaml` | 92 |   - DOMAIN/  - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX |   # > Augment |
| PBS | `Clash/Provider/Media/PBS.yaml` | 1 |   - DOMAIN-SUFFIX |   # > PBS |
| Proxy | `Clash/Provider/Proxy.yaml` | 736 |   - DOMAIN/  - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - IP-CIDR |   # > Blizzard |
| Pandora | `Clash/Provider/Media/Pandora.yaml` | 2 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Pandora |
| PayPal | `Clash/Provider/PayPal.yaml` | 3 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX |   # > PayPal |
| Pornhub | `Clash/Provider/Media/Pornhub.yaml` | 4 |   - DOMAIN-SUFFIX |   # > Pornhub |
| Scholar | `Clash/Provider/Scholar.yaml` | 74 |   - DOMAIN-SUFFIX |   # > Scholar |
| Soundcloud | `Clash/Provider/Media/Soundcloud.yaml` | 4 |   - DOMAIN-SUFFIX |   # > SoundCloud |
| Special | `Clash/Provider/Special.yaml` | 108 |   - DOMAIN/  - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Apple CDN |
| Speedtest | `Clash/Provider/Speedtest.yaml` | 5 |   - DOMAIN/  - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX |   # > Fast |
| Spotify | `Clash/Provider/Media/Spotify.yaml` | 6 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Spotify |
| Steam | `Clash/Provider/Steam.yaml` | 6 |   - DOMAIN-SUFFIX |   # > Steam |
| Telegram | `Clash/Provider/Telegram.yaml` | 32 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX/  - IP-CIDR/  - IP-CIDR6 |   # > Telegram |
| Tencent Video | `Clash/Provider/Media/Tencent Video.yaml` | 2 |   - DOMAIN-SUFFIX |   # > Tencent Video |
| ViuTV | `Clash/Provider/Media/ViuTV.yaml` | 12 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > ViuTV |
| WeTV | `Clash/Provider/Media/WeTV.yaml` | 3 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > WeTV |
| YouTube | `Clash/Provider/Media/YouTube.yaml` | 167 |   - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > Youtube |
| Youku | `Clash/Provider/Media/Youku.yaml` | 3 |   - DOMAIN-SUFFIX |   # > Youku |
| encoreTVB | `Clash/Provider/Media/encoreTVB.yaml` | 4 |   - DOMAIN/  - DOMAIN-SUFFIX/  - PROCESS-NAME |   # > encoreTVB |
| miHoYo | `Clash/Provider/miHoYo.yaml` | 7 |   - DOMAIN-SUFFIX |   # > miHoYo |
| myTV SUPER | `Clash/Provider/Media/myTV SUPER.yaml` | 4 |   - DOMAIN-KEYWORD/  - DOMAIN-SUFFIX |   # > myTV_SUPER |
| AdBlock | `Clash/Provider/AdBlock.yaml` | 8237 |   - DOMAIN/  - DOMAIN-SUFFIX/  - IP-CIDR/  - IP-CIDR6 |  Ads in Video apps |
| HTTPDNS | `Clash/Provider/HTTPDNS.yaml` | 45 |   - DOMAIN/  - IP-CIDR/  - IP-CIDR6 |  Block HTTPDNS |
| TikTok | `Clash/Provider/TikTok.yaml` | 12 |   - DOMAIN-SUFFIX |   # > TikTok |
| Douyin | `Clash/Provider/Douyin.yaml` | 6 |   - DOMAIN-SUFFIX |   # > Douyin |
| MyProxy | `Custom/MyProxy.yaml` | 1 |   - DOMAIN-SUFFIX |   # 个人·强制走代理（最高优先级，可覆盖 AdBlock 误拦）。 |
| MyDirect | `Custom/MyDirect.yaml` | 1 |   - DOMAIN-SUFFIX |   # 个人·强制直连（最高优先级，可覆盖 AdBlock 误拦）。 |
| appleai | `Custom/appleai.yaml` | 6 |   - DOMAIN/  - DOMAIN-SUFFIX |   # > AppleAI |

**合计域名/规则条目：20010**（去重前，按文件累加）
