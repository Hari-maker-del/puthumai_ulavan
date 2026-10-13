# Puthumai Ulavan — Farmer Usability Validation Kit

## Purpose

Validate whether farmers can understand and use Puthumai Ulavan before investing more in marketing or adding features. This is a research guide, not evidence that testing has already happened.

**Production site:** https://puthumai-ulavan.vercel.app/

## Who to speak with

Start with 5–8 farmers for an initial qualitative round. This is enough to uncover obvious usability problems, not to prove that the product works for all farmers.

Try to include:
- Tamil-speaking farmers with different levels of smartphone confidence.
- Different age groups and farm sizes.
- Farmers who primarily use Tamil, including those who prefer voice notes or speaking over typing.
- If feasible, at least one farmer who has unreliable mobile internet.

Do not collect Aadhaar numbers, bank details, passwords, precise plot coordinates, or other unnecessary sensitive information. Ask permission before taking notes, photos, or recordings. Participation should be voluntary.

## How to run a 15–20 minute session

1. Meet the farmer where they are comfortable; use their preferred language.
2. Explain: “We are testing the website, not testing you. Please tell me what you expect and what confuses you.”
3. Ask permission to observe their use of the site on their own phone where possible.
4. Give one task at a time. Read the task aloud if needed, but do not guide them to the answer.
5. Record what they do, where they hesitate, their exact words, and whether they finish without help.
6. Finish by asking what would make them use or avoid the product.
7. Thank them; do not promise future yield, profit, diagnosis, or government benefits.

## Read this introduction in Tamil

“வணக்கம். புதுமை உழவன் இணையதளத்தை விவசாயிகளுக்கு இன்னும் எளிமையாக மாற்ற உங்கள் கருத்தை அறிய விரும்புகிறோம். இது உங்களைச் சோதிப்பது அல்ல; இணையதளத்தைச் சோதிப்பதுதான். புரியாத இடம் இருந்தாலும் தயங்காமல் சொல்லுங்கள். உங்கள் விருப்பமின்றி உங்கள் பெயர் அல்லது தனிப்பட்ட விவரங்களைப் பதிவு செய்யமாட்டோம். பங்கேற்பது உங்கள் விருப்பம்.”

## Task script

Ask the farmer to try each task without step-by-step instructions. Skip any task that depends on a feature that is not available in the current build.

1. **First impression:** “இந்த இணையதளம் எதற்காக உதவும் என்று நினைக்கிறீர்கள்?”  
   Observe whether the farmer can explain the purpose in their own words.

2. **Find a starting point:** “உங்கள் பண்ணைக்கு ஏற்ற தகவல்களைப் பெற ஆரம்பிக்க எங்கு செல்வீர்கள்?”  
   Observe whether the main call to action is clear and whether sign-in is understandable.

3. **Understand the advice:** Show only an actually available recommendation or advisory feature. Ask: “இந்த ஆலோசனை என்ன சொல்கிறது? அடுத்து நீங்கள் என்ன செய்வீர்கள்?”  
   Check whether limitations and uncertainty are clear. Do not ask farmers to act on unverified advice.

4. **Find a relevant feature:** “பயிர் தேர்வு / செலவு பதிவு / பயிர் கண்காணிப்பு போன்ற உதவி தேவைப்பட்டால் அதை எப்படிக் கண்டுபிடிப்பீர்கள்?”  
   Only test features present and functioning in the current build; mark unavailable features as not tested.

5. **Language and readability:** “இதில் உள்ள சொற்கள் உங்களுக்கு இயல்பாகவும் தெளிவாகவும் இருக்கிறதா? எந்தச் சொற்களை மாற்ற வேண்டும்?”  
   Ask about Tamil wording, text size, icons, and whether they would prefer voice input.

6. **Mobile and connection:** Ask them to use the site on their normal phone and connection. If connectivity is poor, observe what fails and whether the site explains what to do. Do not claim offline support unless it is verified.

7. **Trust:** “இந்த இணையதளத்தை நம்புவதற்கு உங்களுக்கு என்ன தகவல் தேவை? எந்த விஷயம் சந்தேகமாக இருக்கிறது?”  
   Listen for concerns about data privacy, accuracy, costs, who provides advice, and whether the product makes exaggerated promises.

## Questions to ask at the end

- “இதில் உங்களுக்கு மிகவும் பயனுள்ளதாக இருப்பது எது?”
- “எது குழப்பமாக இருந்தது அல்லது தேவையற்றதாக இருந்தது?”
- “இதை மீண்டும் பயன்படுத்துவீர்களா? ஏன் / ஏன் இல்லை?”
- “இதைப் பயன்படுத்துவதற்கு முன் உங்களுக்கு என்ன தெரிந்திருக்க வேண்டும்?”
- “ஒரு விஷயத்தை மட்டும் மாற்ற முடிந்தால், எதை மாற்றுவீர்கள்?”

Do not lead the farmer toward positive answers. Silence is useful; let them think.

## Session scorecard

Create one row per task and participant.

| Field | What to record |
|---|---|
| Participant code | F01, F02, etc.; avoid names in the research sheet |
| Preferred language | Tamil / Tanglish / other, as volunteered |
| Task | Use the task number |
| Outcome | Completed independently / completed with help / not completed / not tested |
| Hesitation or error | What actually happened, without judgment |
| Exact feedback | Short quote, with permission |
| Severity | Blocker / major / minor |
| Suggested change | Concrete improvement |
| Follow-up needed | Yes / no |

## Prioritization

- **P0 — Blocker:** Farmer cannot start, a critical flow fails, personal information is exposed, or the interface makes a dangerous or misleading claim.
- **P1 — Major:** The main purpose or next step is unclear; Tamil wording prevents understanding; a core task repeatedly needs help.
- **P2 — Minor:** Visual polish, small wording changes, spacing, or non-critical preferences.

Fix repeated P0/P1 issues before adding more features. If one farmer encounters a safety, privacy, or misleading-advice problem, investigate it immediately even if it has not repeated.

## Go/no-go criteria for the next iteration

After the first 5–8 sessions, summarize patterns rather than treating the sample as statistically representative. A useful initial target is:
- Most participants can explain the product’s purpose in their own words.
- Most can find the appropriate next step without coaching.
- No unresolved P0 safety, privacy, or trust issue remains.
- All confusing Tamil terms are logged with farmer-preferred alternatives.
- Features described in marketing are actually available and working.

These are internal usability targets, not claims for public marketing. Repeat testing after fixes.

## What not to claim

Until verified, do not claim guaranteed yield or profit, definitive disease diagnosis, government approval, fully offline operation, live weather accuracy, or support for languages and voice features that have not been tested end-to-end.

## Research summary template

- Date / village (optional, only at a broad level):
- Number of participants:
- Devices and connection conditions:
- Top 3 things farmers understood:
- Top 3 points of confusion:
- P0/P1 issues:
- Tamil terms to change:
- Trust and privacy concerns:
- Feature claims that need verification:
- Changes to make before the next test:
- What still needs another test round:
