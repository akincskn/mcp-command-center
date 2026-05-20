# MCP Command Center — VISION

> **Status:** v2 (MCP transport revised) | **Last updated:** 2026-05-11 | **Owner:** Akın Coşkun

---

## 1. Tek Cümlelik Tanım

**MCP Command Center**, doğal dil komutlarını birden fazla MCP-shaped tool üzerinde zincirleyerek çalıştıran bir AI orchestration platformudur. Kullanıcı komutu yazar; AI önce **adım adım bir plan üretir**, kullanıcı planı görür ve onaylar; sistem planı şeffaf bir şekilde çalıştırır.

Pozisyonlama: **"Plan-then-execute orchestration for the MCP ecosystem."**

## 2. Asıl Amaç

Bu proje jenerik altyapı. Yarın yeni bir MCP tool eklendiğinde platform otomatik kullanabilmeli.

Göstermek istediklerimiz:
1. MCP'nin tüm gücü birleştirilebilir (tools + resources + prompts)
2. Multi-tool zincirleme komutlar doğal dil ile mümkündür
3. AI agent davranışı şeffaf yapılabilir
4. Cost-aware multi-agent routing production-grade yapılabilir

## 3. Yapıyoruz / Yapmıyoruz

**Yapıyoruz:**
- MCP-shaped tool orchestration engine
- Multi-tool chaining (3 farklı backend: GitHub, Tavily, Memory)
- Multi-agent routing (Speed / Balanced / Quality)
- Plan-then-execute UX
- Live execution visualization
- Resource autocomplete
- Cost transparency dashboard
- Multi-tenant architecture
- Demo mode (seeded data)

**Yapmıyoruz:**
- GitHub repo analiz aracı değil — GitHub sadece bir backend
- Chatbot değil
- Workflow automation değil — AI dinamik plan üretir
- Production SaaS değil
- N8N entegrasyonu yok (Faz 1)
- Mobile app yok
- Real-time collaboration yok
- Marketing site yok

## 4. MCP Yaklaşımı (REVISED v2)

**Önceki yaklaşım:** Resmi MCP server'larını subprocess spawn ile çalıştır.

**Yeni yaklaşım:** MCP **tool specification'larını** takip ederiz; backend implementation pragmatik.

Sebep: Vercel serverless'da subprocess spawn güvenilmez. Demo trafiği için risk fazla.

**Implementation:**
- Tool schema'ları MCP formatında (`tools/list`, `tools/call` shape)
- Backend: GitHub → Octokit, Brave Search → fetch, Memory → Postgres
- Frontend: tek tip MCP UX
- Faz 2: gerçek MCP server'lara geçiş trivial (interface aynı)

Pitch: "MCP-compatible orchestration architecture"

## 5. Hedef Kullanıcı

**Birincil:** Upwork client'ları, recruiter'lar, hiring manager'lar
- 2-5 dakikalık etkileşim
- Google OAuth ile hızlı login

**İkincil:** AI/MCP ekosistemindeki developer'lar
- "MCP nasıl kullanılır?" merakı
- Kendi GitHub'ıyla deneme

## 6. Üç Demo Senaryosu

### Senaryo A — Developer Workflow
**Komut:** "akincskn/mcp-command-center son 5 issue'sunu listele, web'de benzer açık-kaynak projeleri ara, karşılaştırma yap"

**Tool zinciri:** GitHub → Tavily → GitHub × 3 → LLM (Quality) → Memory

**~25s, ~12K token**

### Senaryo B — Research Workflow
**Komut:** "MCP protokolü hakkında 5 makale bul, key insights çıkar, knowledge base'e kaydet"

**Tool zinciri:** Tavily search → LLM (Balanced) → tavily.web_fetch × 5 → LLM (Quality) → Memory

**~20s, ~8K token**

### Senaryo C — Knowledge Workflow (seeded)
**Komut:** "Geçen seferki mcp-command-center roadmap analysis'ini hatırla, GitHub'daki güncellemelerle karşılaştır"

**Tool zinciri:** Memory (seeded) → GitHub → LLM (Quality) → Memory update

**~15s, ~6K token**

> Senaryo C için her yeni user kayıt olduğunda otomatik seeded memory eklenir.

Dashboard'da **"Example Commands"** kartları olur.

## 7. Diferansiyasyon

| Boyut | Çoğu AI Tool | MCP Command Center |
|---|---|---|
| Tool kullanımı | Tek çağrı | Zincirleme |
| Şeffaflık | Kara kutu | Plan önce, onay sonra |
| MCP primitive'leri | Sadece tools | Tools + Resources + Prompts |
| Cost | Yok | Per-step tracking |
| Agent seçimi | Sabit | Speed/Balanced/Quality + Auto |
| Resource ref | Yok | @ autocomplete |

## 8. Faz 1 / Faz 2

**Faz 1:** 3 tool backend, multi-agent routing, plan-then-execute, viz, autocomplete, cost dashboard, 3 senaryo, Google+GitHub OAuth, multi-tenant DB, Vercel $0/ay

**Faz 2:** Gerçek MCP server entegrasyonu (Railway hosted), Slack/Notion/Linear tools, N8N export, BYOK, plan templates, collaboration, mobile, open source

## 9. Kararlar

| Soru | Karar | Sebep |
|---|---|---|
| MCP transport | Hybrid: schema MCP, backend native API | Vercel serverless uyumu |
| Plan modification | Sadece [Execute]/[Cancel] | Edit UX 1 hafta ekler |
| Failure handling | Stop on first + retry button | Karmaşık fallback gereksiz |
| Memory scope | User-isolated, persistent | Her user kendi context'i |
| GitHub OAuth reuse | Login token = MCP auth | Smooth UX, scope: read:user, public_repo |
| Demo data | akincskn/mcp-command-center kendi reposu (inception narrative) | Authentic |
| Plan caching | Yok | Öğretici demo değeri |
| Senaryo C seed | Auto-seeded user kayıtta | Sıralı demo gereksiz |
| Rate limit fallback | Basit retry-with-backoff | Faz 1 için yeterli |

## 10. Başarı Kriterleri

**Demo izleyici:**
- 30s içinde "ne yapıyor" anlar
- 1dk içinde ilk komut çalıştırır
- Plan viz'de en az 1 "vay" reaksiyonu
- "Bunu sen mi yaptın?" sorusu

**Teknik:**
- 3 senaryo ilk denemede çalışır
- Cold start sonrası ilk komut <30s
- Free tier limitlerinde
- $0/ay maliyet

**Anti-kriterler (BAŞARISIZ):**
- Demo izleyen 30s'de çıkar
- Plan viz fail/yavaş
- "Sadece GitHub aracı" algısı
- Timeout/cold start yansır
- UI amateur hisseder

## 11. Kısıtlar

- Vercel Hobby: 10s timeout → background job zorunlu
- Groq free: 30 RPM, 14.4K RPD (tüm 3 tier — Gemini Faz 2'ye ertelendi, project access issue)
- Neon free: 0.5GB
- Tavily free: 1000 query/ay
- Demo trafiği: 5-50 req/gün