# Native release checklist

These checks require physical iOS and Android devices. Browser smoke tests and JS bundles do **not** validate native permissions, image capture or sharing.

- Open in compatible Expo Go or an EAS preview build. Choose both sports.
- Pick a portrait HEIC/JPEG and a landscape image. Cancel the picker; ensure the previous selection remains.
- Deny/limit photo permissions. Confirm the system picker still works and Save offers a helpful error if denied.
- Try no provider, provider timeout, invalid credentials, a valid cutout. Confirm original photo fallback preserves the person's face/body and can be restored.
- Use a real licensed athlete photo. Check head/feet framing and legible type in Cinematic, Dark and Neon with light and dark team colors. Use maximum-length names.
- Export Story and Post. Inspect actual PNG metadata: **1080×1920** and **1080×1350**. Inspect at 100% for sharp text, loaded photos and correct fonts.
- Save to Photos, open the PNG, share via the native sheet to Instagram and another app, and cancel sharing.
- Restart the app; open My Creations, edit, re-export in the other format. Export a new poster after using the free one: no payment or fake purchase is offered.
- Delete one/all creations, relaunch, confirm they are gone and the used free credit is retained. Photos/shared copies remain outside app control.
- Test low storage, offline use, large photo, rapid taps during export, Android Back, small screens, text scaling and VoiceOver/TalkBack.
- Review iOS privacy labels / Android Data Safety, provider processing terms, store permission declarations and HTTPS before distributing.

Youth use, payments and multi-device entitlements require additional product and backend work. The local free-poster record is deliberately not fraud-resistant and can be reset by uninstalling the app.
