import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { APP_LANGUAGES, DEFAULT_LANGUAGE, getLanguage, LANGUAGE_STORAGE_KEY } from './languages';
import { translateUiText } from './uiTranslations';
import { supabase } from '@/lib/supabase';

interface I18nValue {
  language: string;
  languageInfo: ReturnType<typeof getLanguage>;
  setLanguage: (code: string) => void;
  languages: typeof APP_LANGUAGES;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

const textOriginals = new WeakMap<Text, string>();
const attributeOriginals = new WeakMap<Element, Record<string, string>>();

const translations: Record<string, Record<string, string>> = {
  en: {
    chooseLanguage: 'Choose your language',
    welcomeBack: 'Welcome back',
    signIn: 'Sign in',
    createAccount: 'Create account',
    howUse: 'How will you use Puthumai Uzhavan?',
    farmer: 'I’m a Farmer',
    farmerDesc: 'Get personalized crop, weather, market and AI recommendations based on your farm.',
    visitor: 'I’m a Visitor',
    visitorDesc: 'Explore Puthumai Uzhavan and experience its features.',
    continue: 'Continue',
    setupFarm: 'Set up your farm',
    setupFarmDesc: 'Tell us about your farm so Puthumai Uzhavan can give you personalized advice.',
    saveContinue: 'Save & Continue',
    onboardingDone: 'Your farm profile is ready!',
    onboardingDoneDesc: 'Puthumai Uzhavan will now use your farm context to personalize your recommendations.',
    goDashboard: 'Go to Dashboard',
    selectRole: 'Choose your role',
    languageSaved: 'Language preference saved',
  },
  hi: { chooseLanguage: 'अपनी भाषा चुनें', welcomeBack: 'वापसी पर स्वागत है', signIn: 'लॉग इन करें', createAccount: 'खाता बनाएं', howUse: 'आप पुथुमई उझवन का उपयोग कैसे करेंगे?', farmer: 'मैं किसान हूँ', farmerDesc: 'अपने खेत के आधार पर फसल, मौसम, बाजार और AI की व्यक्तिगत सलाह पाएं।', visitor: 'मैं आगंतुक हूँ', visitorDesc: 'पुथुमई उझवन की सुविधाओं को देखें और अनुभव करें।', continue: 'जारी रखें', setupFarm: 'अपना खेत सेट करें', setupFarmDesc: 'अपने खेत की जानकारी दें ताकि आपको व्यक्तिगत सलाह मिल सके।', saveContinue: 'सहेजें और जारी रखें', onboardingDone: 'आपकी खेत प्रोफ़ाइल तैयार है!', onboardingDoneDesc: 'अब पुथुमई उझवन आपकी प्रोफ़ाइल के आधार पर सुझाव देगा।', goDashboard: 'डैशबोर्ड पर जाएं', selectRole: 'अपनी भूमिका चुनें', languageSaved: 'भाषा की पसंद सहेजी गई' },
  ta: { chooseLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்', welcomeBack: 'மீண்டும் வரவேற்கிறோம்', signIn: 'உள்நுழைக', createAccount: 'கணக்கை உருவாக்கு', howUse: 'Puthumai Uzhavan-ஐ எவ்வாறு பயன்படுத்தப் போகிறீர்கள்?', farmer: 'நான் விவசாயி', farmerDesc: 'உங்கள் பண்ணைத் தகவலின் அடிப்படையில் தனிப்பயன் பயிர், வானிலை, சந்தை மற்றும் AI ஆலோசனைகளைப் பெறுங்கள்.', visitor: 'நான் பார்வையாளர்', visitorDesc: 'Puthumai Uzhavan அம்சங்களை ஆராய்ந்து அனுபவிக்கவும்.', continue: 'தொடரவும்', setupFarm: 'உங்கள் பண்ணையை அமைக்கவும்', setupFarmDesc: 'தனிப்பயன் ஆலோசனைகளை வழங்க உங்கள் பண்ணைத் தகவலைப் பகிரவும்.', saveContinue: 'சேமித்து தொடரவும்', onboardingDone: 'உங்கள் பண்ணை சுயவிவரம் தயாராக உள்ளது!', onboardingDoneDesc: 'உங்கள் பண்ணைத் தகவலைப் பயன்படுத்தி தனிப்பயன் பரிந்துரைகள் வழங்கப்படும்.', goDashboard: 'டாஷ்போர்டுக்குச் செல்லவும்', selectRole: 'உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்', languageSaved: 'மொழி விருப்பம் சேமிக்கப்பட்டது' },
  te: { chooseLanguage: 'మీ భాషను ఎంచుకోండి', welcomeBack: 'తిరిగి స్వాగతం', signIn: 'లాగిన్', createAccount: 'ఖాతా సృష్టించండి', howUse: 'మీరు పుతుమై ఉళవన్‌ను ఎలా ఉపయోగిస్తారు?', farmer: 'నేను రైతును', farmerDesc: 'మీ పొలం ఆధారంగా వ్యక్తిగత పంట, వాతావరణ, మార్కెట్ మరియు AI సలహాలు పొందండి.', visitor: 'నేను సందర్శకుడిని', visitorDesc: 'పుతుమై ఉళవన్ ఫీచర్లను అనుభవించండి.', continue: 'కొనసాగించండి', setupFarm: 'మీ పొలాన్ని ఏర్పాటు చేయండి', setupFarmDesc: 'వ్యక్తిగత సలహాల కోసం మీ పొలం వివరాలను అందించండి.', saveContinue: 'సేవ్ చేసి కొనసాగించండి', onboardingDone: 'మీ పొలం ప్రొఫైల్ సిద్ధంగా ఉంది!', onboardingDoneDesc: 'మీ పొలం వివరాల ఆధారంగా వ్యక్తిగత సిఫార్సులు అందుతాయి.', goDashboard: 'డ్యాష్‌బోర్డ్‌కు వెళ్లండి', selectRole: 'మీ పాత్రను ఎంచుకోండి', languageSaved: 'భాషా ప్రాధాన్యత సేవ్ చేయబడింది' },
  ml: { chooseLanguage: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക', welcomeBack: 'തിരികെ സ്വാഗതം', signIn: 'ലോഗിൻ ചെയ്യുക', createAccount: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക', howUse: 'Puthumai Uzhavan എങ്ങനെ ഉപയോഗിക്കും?', farmer: 'ഞാൻ കർഷകനാണ്', farmerDesc: 'നിങ്ങളുടെ കൃഷിയിടത്തെ അടിസ്ഥാനമാക്കി വ്യക്തിഗത വിള, കാലാവസ്ഥ, വിപണി, AI നിർദ്ദേശങ്ങൾ നേടുക.', visitor: 'ഞാൻ സന്ദർശകനാണ്', visitorDesc: 'Puthumai Uzhavan സവിശേഷതകൾ പരിചയപ്പെടുക.', continue: 'തുടരുക', setupFarm: 'നിങ്ങളുടെ കൃഷിയിടം സജ്ജമാക്കുക', setupFarmDesc: 'വ്യക്തിഗത ഉപദേശങ്ങൾക്കായി നിങ്ങളുടെ കൃഷിയിട വിവരങ്ങൾ നൽകുക.', saveContinue: 'സംരക്ഷിച്ച് തുടരുക', onboardingDone: 'നിങ്ങളുടെ കൃഷിയിട പ്രൊഫൈൽ തയ്യാറായി!', onboardingDoneDesc: 'നിങ്ങളുടെ കൃഷിയിട വിവരങ്ങളെ അടിസ്ഥാനമാക്കി വ്യക്തിഗത നിർദ്ദേശങ്ങൾ നൽകും.', goDashboard: 'ഡാഷ്ബോർഡിലേക്ക് പോകുക', selectRole: 'നിങ്ങളുടെ പങ്ക് തിരഞ്ഞെടുക്കുക', languageSaved: 'ഭാഷാ മുൻഗണന സംരക്ഷിച്ചു' },
  kn: { chooseLanguage: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', welcomeBack: 'ಮತ್ತೆ ಸ್ವಾಗತ', signIn: 'ಲಾಗಿನ್', createAccount: 'ಖಾತೆ ರಚಿಸಿ', howUse: 'ನೀವು ಪುದುಮೈ ಉಝವನನ್ನು ಹೇಗೆ ಬಳಸುತ್ತೀರಿ?', farmer: 'ನಾನು ರೈತ', farmerDesc: 'ನಿಮ್ಮ ಕೃಷಿ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ವೈಯಕ್ತಿಕ ಬೆಳೆ, ಹವಾಮಾನ, ಮಾರುಕಟ್ಟೆ ಮತ್ತು AI ಸಲಹೆ ಪಡೆಯಿರಿ.', visitor: 'ನಾನು ಸಂದರ್ಶಕ', visitorDesc: 'ಪುದುಮೈ ಉಝವನ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನುಭವಿಸಿ.', continue: 'ಮುಂದುವರಿಸಿ', setupFarm: 'ನಿಮ್ಮ ಕೃಷಿಯನ್ನು ಹೊಂದಿಸಿ', setupFarmDesc: 'ವೈಯಕ್ತಿಕ ಸಲಹೆಗಾಗಿ ನಿಮ್ಮ ಕೃಷಿ ವಿವರಗಳನ್ನು ನೀಡಿ.', saveContinue: 'ಉಳಿಸಿ ಮತ್ತು ಮುಂದುವರಿಸಿ', onboardingDone: 'ನಿಮ್ಮ ಕೃಷಿ ಪ್ರೊಫೈಲ್ ಸಿದ್ಧವಾಗಿದೆ!', onboardingDoneDesc: 'ನಿಮ್ಮ ಕೃಷಿ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ವೈಯಕ್ತಿಕ ಸಲಹೆ ನೀಡಲಾಗುತ್ತದೆ.', goDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ', selectRole: 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ', languageSaved: 'ಭಾಷಾ ಆದ್ಯತೆ ಉಳಿಸಲಾಗಿದೆ' },
  bn: { chooseLanguage: 'আপনার ভাষা নির্বাচন করুন', welcomeBack: 'আবার স্বাগতম', signIn: 'লগ ইন করুন', createAccount: 'অ্যাকাউন্ট তৈরি করুন', howUse: 'আপনি পুথুমাই উঝাভান কীভাবে ব্যবহার করবেন?', farmer: 'আমি একজন কৃষক', farmerDesc: 'আপনার খামারের তথ্যের ভিত্তিতে ব্যক্তিগত ফসল, আবহাওয়া, বাজার ও AI পরামর্শ পান।', visitor: 'আমি একজন দর্শনার্থী', visitorDesc: 'পুথুমাই উঝাভানের বৈশিষ্ট্যগুলি দেখুন ও ব্যবহার করুন।', continue: 'চালিয়ে যান', setupFarm: 'আপনার খামার সেট আপ করুন', setupFarmDesc: 'ব্যক্তিগত পরামর্শের জন্য আপনার খামারের তথ্য দিন।', saveContinue: 'সংরক্ষণ করে চালিয়ে যান', onboardingDone: 'আপনার খামার প্রোফাইল প্রস্তুত!', onboardingDoneDesc: 'আপনার খামারের তথ্য ব্যবহার করে ব্যক্তিগত পরামর্শ দেওয়া হবে।', goDashboard: 'ড্যাশবোর্ডে যান', selectRole: 'আপনার ভূমিকা নির্বাচন করুন', languageSaved: 'ভাষার পছন্দ সংরক্ষিত হয়েছে' },
  mr: { chooseLanguage: 'तुमची भाषा निवडा', welcomeBack: 'पुन्हा स्वागत आहे', signIn: 'लॉग इन करा', createAccount: 'खाते तयार करा', howUse: 'तुम्ही पुथुमई उझवन कसे वापराल?', farmer: 'मी शेतकरी आहे', farmerDesc: 'तुमच्या शेताच्या माहितीनुसार वैयक्तिक पीक, हवामान, बाजार आणि AI सल्ला मिळवा.', visitor: 'मी पाहुणा आहे', visitorDesc: 'पुथुमई उझवनची वैशिष्ट्ये अनुभवण्यासाठी वापरा.', continue: 'पुढे चला', setupFarm: 'तुमचे शेत सेट करा', setupFarmDesc: 'वैयक्तिक सल्ल्यासाठी तुमच्या शेताची माहिती द्या.', saveContinue: 'जतन करा आणि पुढे चला', onboardingDone: 'तुमची शेत प्रोफाइल तयार आहे!', onboardingDoneDesc: 'तुमच्या शेताच्या संदर्भावर आधारित वैयक्तिक सूचना दिल्या जातील.', goDashboard: 'डॅशबोर्डवर जा', selectRole: 'तुमची भूमिका निवडा', languageSaved: 'भाषा प्राधान्य जतन केले' },
  gu: { chooseLanguage: 'તમારી ભાષા પસંદ કરો', welcomeBack: 'ફરી સ્વાગત છે', signIn: 'લૉગ ઇન કરો', createAccount: 'ખાતું બનાવો', howUse: 'તમે પુંથમાઈ ઉઝવનનો ઉપયોગ કેવી રીતે કરશો?', farmer: 'હું ખેડૂત છું', farmerDesc: 'તમારા ખેતરની માહિતીના આધારે વ્યક્તિગત પાક, હવામાન, બજાર અને AI સલાહ મેળવો.', visitor: 'હું મુલાકાતી છું', visitorDesc: 'પુંથમાઈ ઉઝવનની સુવિધાઓ અજમાવો.', continue: 'ચાલુ રાખો', setupFarm: 'તમારું ખેતર સેટ કરો', setupFarmDesc: 'વ્યક્તિગત સલાહ માટે તમારા ખેતરની માહિતી આપો.', saveContinue: 'સાચવો અને ચાલુ રાખો', onboardingDone: 'તમારી ખેતર પ્રોફાઇલ તૈયાર છે!', onboardingDoneDesc: 'તમારા ખેતરના સંદર્ભના આધારે વ્યક્તિગત ભલામણો મળશે.', goDashboard: 'ડેશબોર્ડ પર જાઓ', selectRole: 'તમારી ભૂમિકા પસંદ કરો', languageSaved: 'ભાષા પસંદગી સાચવાઈ' },
  pa: { chooseLanguage: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ', welcomeBack: 'ਜੀ ਆਇਆਂ ਨੂੰ ਵਾਪਸ', signIn: 'ਲੌਗ ਇਨ ਕਰੋ', createAccount: 'ਖਾਤਾ ਬਣਾਓ', howUse: 'ਤੁਸੀਂ ਪੁਥੁਮਈ ਉਝਵਨ ਨੂੰ ਕਿਵੇਂ ਵਰਤੋਗੇ?', farmer: 'ਮੈਂ ਕਿਸਾਨ ਹਾਂ', farmerDesc: 'ਆਪਣੇ ਖੇਤ ਦੇ ਆਧਾਰ ਤੇ ਵਿਅਕਤੀਗਤ ਫਸਲ, ਮੌਸਮ, ਬਾਜ਼ਾਰ ਅਤੇ AI ਸਲਾਹ ਲਵੋ।', visitor: 'ਮੈਂ ਵਿਜ਼ਟਰ ਹਾਂ', visitorDesc: 'ਪੁਥੁਮਈ ਉਝਵਨ ਦੀਆਂ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਵੇਖੋ ਅਤੇ ਅਨੁਭਵ ਕਰੋ।', continue: 'ਜਾਰੀ ਰੱਖੋ', setupFarm: 'ਆਪਣਾ ਖੇਤ ਸੈੱਟ ਕਰੋ', setupFarmDesc: 'ਵਿਅਕਤੀਗਤ ਸਲਾਹ ਲਈ ਆਪਣੇ ਖੇਤ ਦੀ ਜਾਣਕਾਰੀ ਦਿਓ।', saveContinue: 'ਸੇਵ ਕਰਕੇ ਜਾਰੀ ਰੱਖੋ', onboardingDone: 'ਤੁਹਾਡੀ ਖੇਤ ਪ੍ਰੋਫਾਈਲ ਤਿਆਰ ਹੈ!', onboardingDoneDesc: 'ਤੁਹਾਡੇ ਖੇਤ ਦੇ ਸੰਦਰਭ ਅਨੁਸਾਰ ਵਿਅਕਤੀਗਤ ਸੁਝਾਅ ਦਿੱਤੇ ਜਾਣਗੇ।', goDashboard: 'ਡੈਸ਼ਬੋਰਡ ਤੇ ਜਾਓ', selectRole: 'ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ', languageSaved: 'ਭਾਸ਼ਾ ਪਸੰਦ ਸੇਵ ਹੋ ਗਈ' },
  or: { chooseLanguage: 'ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ', welcomeBack: 'ପୁଣିଥରେ ସ୍ୱାଗତ', signIn: 'ଲଗ୍ ଇନ୍ କରନ୍ତୁ', createAccount: 'ଖାତା ତିଆରି କରନ୍ତୁ', howUse: 'ଆପଣ ପୁଥୁମାଇ ଉଝାଭାନକୁ କିପରି ବ୍ୟବହାର କରିବେ?', farmer: 'ମୁଁ ଜଣେ କୃଷକ', farmerDesc: 'ଆପଣଙ୍କ ଚାଷ ତଥ୍ୟ ଆଧାରରେ ବ୍ୟକ୍ତିଗତ ଫସଲ, ପାଣିପାଗ, ବଜାର ଓ AI ପରାମର୍ଶ ପାଆନ୍ତୁ।', visitor: 'ମୁଁ ଜଣେ ପରିଦର୍ଶକ', visitorDesc: 'ପୁଥୁମାଇ ଉଝାଭାନର ସୁବିଧାଗୁଡିକ ଅନୁଭବ କରନ୍ତୁ।', continue: 'ଜାରି ରଖନ୍ତୁ', setupFarm: 'ଆପଣଙ୍କ ଚାଷ ତଥ୍ୟ ସେଟ୍ କରନ୍ତୁ', setupFarmDesc: 'ବ୍ୟକ୍ତିଗତ ପରାମର୍ଶ ପାଇଁ ଆପଣଙ୍କ ଚାଷ ତଥ୍ୟ ଦିଅନ୍ତୁ।', saveContinue: 'ସଞ୍ଚୟ କରି ଜାରି ରଖନ୍ତୁ', onboardingDone: 'ଆପଣଙ୍କ ଚାଷ ପ୍ରୋଫାଇଲ୍ ପ୍ରସ୍ତୁତ!', onboardingDoneDesc: 'ଆପଣଙ୍କ ଚାଷ ତଥ୍ୟ ଆଧାରରେ ବ୍ୟକ୍ତିଗତ ପରାମର୍ଶ ମିଳିବ।', goDashboard: 'ଡ୍ୟାଶବୋର୍ଡକୁ ଯାଆନ୍ତୁ', selectRole: 'ଆପଣଙ୍କ ଭୂମିକା ବାଛନ୍ତୁ', languageSaved: 'ଭାଷା ପସନ୍ଦ ସଞ୍ଚୟ ହୋଇଛି' },
  ur: { chooseLanguage: 'اپنی زبان منتخب کریں', welcomeBack: 'خوش آمدید', signIn: 'لاگ اِن کریں', createAccount: 'اکاؤنٹ بنائیں', howUse: 'آپ پتھومئی اژوان کو کیسے استعمال کریں گے؟', farmer: 'میں کسان ہوں', farmerDesc: 'اپنے کھیت کی معلومات کی بنیاد پر فصل، موسم، بازار اور AI کی ذاتی تجاویز حاصل کریں۔', visitor: 'میں مہمان ہوں', visitorDesc: 'پتھومئی اژوان کی خصوصیات کا تجربہ کریں۔', continue: 'جاری رکھیں', setupFarm: 'اپنا کھیت سیٹ کریں', setupFarmDesc: 'ذاتی مشوروں کے لیے اپنے کھیت کی معلومات دیں۔', saveContinue: 'محفوظ کریں اور جاری رکھیں', onboardingDone: 'آپ کے کھیت کا پروفائل تیار ہے!', onboardingDoneDesc: 'آپ کے کھیت کی معلومات کی بنیاد پر ذاتی تجاویز دی جائیں گی۔', goDashboard: 'ڈیش بورڈ پر جائیں', selectRole: 'اپنا کردار منتخب کریں', languageSaved: 'زبان کی ترجیح محفوظ ہو گئی' },
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((code: string) => {
    const next = getLanguage(code).code;
    setLanguageState(next);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* storage unavailable */ }
    void supabase.auth.updateUser({ data: { preferred_language: next } }).catch(() => {});
  }, []);

  const languageInfo = getLanguage(language);

  useEffect(() => {
    document.documentElement.lang = languageInfo.locale;
    document.documentElement.dir = languageInfo.dir ?? 'ltr';
  }, [languageInfo]);

  useEffect(() => {
    const numberMap: Record<string, string> = {
      '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
      '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
      '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9',
      '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9',
      '૦':'0','૧':'1','૨':'2','૩':'3','૪':'4','૫':'5','૬':'6','૭':'7','૮':'8','૯':'9',
      '௦':'0','௧':'1','௨':'2','௩':'3','௪':'4','௫':'5','௬':'6','௭':'7','௮':'8','௯':'9',
      '౦':'0','౧':'1','౨':'2','౩':'3','౪':'4','౫':'5','౬':'6','౭':'7','౮':'8','౯':'9',
      '೦':'0','೧':'1','೨':'2','೩':'3','೪':'4','೫':'5','೬':'6','೭':'7','೮':'8','೯':'9',
      '൦':'0','൧':'1','൨':'2','൩':'3','൪':'4','൫':'5','൬':'6','൭':'7','൮':'8','൯':'9'
    };
    const normalizeNumbers = (value: string) => value.replace(/[٠-٩۰-۹०-९০-৯૦-૯௦-௯౦-౯೦-೯൦-൯]/g, ch => numberMap[ch] ?? ch);
    const translatableAttributes = ['aria-label', 'title', 'placeholder', 'alt'];

    const translateTree = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) nodes.push(node as Text);
      if (root.nodeType === Node.TEXT_NODE) nodes.push(root as Text);

      for (const textNode of nodes) {
        const parent = textNode.parentElement;
        if (!parent || ['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(parent.tagName)) continue;
        const current = textNode.nodeValue ?? '';
        const source = textOriginals.get(textNode) ?? current;
        if (!textOriginals.has(textNode)) textOriginals.set(textNode, source);
        const trimmed = source.trim();
        if (!trimmed) continue;
        const translated = translateUiText(trimmed, language);
        const next = source.replace(trimmed, translated);
        const normalized = normalizeNumbers(next);
        if (normalized !== current) textNode.nodeValue = normalized;
      }

      const elements: Element[] = [];
      if (root.nodeType === Node.ELEMENT_NODE) elements.push(root as Element);
      elements.push(...Array.from((root as Element).querySelectorAll?.('*') ?? []));
      for (const element of elements) {
        if (!attributeOriginals.has(element)) {
          const snapshot: Record<string, string> = {};
          for (const attr of translatableAttributes) {
            const value = element.getAttribute(attr);
            if (value) snapshot[attr] = value;
          }
          attributeOriginals.set(element, snapshot);
        }
        const snapshot = attributeOriginals.get(element) ?? {};
        for (const attr of translatableAttributes) {
          const source = snapshot[attr];
          if (!source) continue;
          element.setAttribute(attr, normalizeNumbers(translateUiText(source, language)));
        }
      }
    };

    translateTree(document.body);
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const added of Array.from(mutation.addedNodes)) {
          if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) translateTree(added);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);



  const value = useMemo<I18nValue>(() => {
  const semanticEnglish: Record<string, string> = {
    chooseLanguage: 'Choose your language',
    welcomeBack: 'Welcome back',
    signIn: 'Sign in',
    createAccount: 'Create account',
    howUse: 'How will you use Puthumai Uzhavan?',
    farmer: 'I’m a Farmer',
    visitor: 'I’m a Visitor',
    continue: 'Continue',
    setupFarm: 'Set up your farm',
    saveContinue: 'Save & Continue',
    goDashboard: 'Go to Dashboard',
    selectRole: 'Choose your role',
    languageSaved: 'Language preference saved',
  };
    return ({
    language,
    languageInfo,
    setLanguage,
    languages: APP_LANGUAGES,
    // Prefer the complete language catalog, then the onboarding catalog, then
    // the English semantic key. This prevents unsupported-language onboarding
    // from silently falling back to an English UI key.
    t: (key) => {
      const semantic = translations[language]?.[key] ?? semanticEnglish[key] ?? key;
      return translateUiText(semantic, language);
    },
    });
  }, [language, languageInfo, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
