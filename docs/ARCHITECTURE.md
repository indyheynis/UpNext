# Architecture and privacy

## Rendering

`Poster` is the serializable document. `PosterCanvas` renders it into a 1080-unit SVG viewBox, with format-specific composition. Native `react-native-svg.toDataURL` rasterizes the same composition directly at requested pixel dimensions after photo load. Export validates the PNG header dimensions before saving; it does not upscale a screen capture. UI typography uses bundled OFL-licensed Barlow Condensed; templates and the geometric athlete illustration are original. No remote photos, licensed team marks or font CDN are required.

Framed photos use a centered cover crop; transparent cutouts use a contained full-body placement. Manual photo positioning is future work. A larger PNG cannot recover detail absent in a low-resolution source image.

## Local state

Selection uses the platform picker; normalization runs locally. PNGs, source photos and editable documents stay in app-private storage. AsyncStorage holds the library index and free-poster identifier. Edited exports use a fresh directory, with the previous version deleted after successful index persistence. UI operations are serialized. Deletion retains the used free-poster record. OS device backups follow OS policy; the app has no custom cloud backup.

The local entitlement is not fraud-resistant: uninstalling/tampering can reset it. Future purchase adapters must use real Apple/Google products, server receipt verification, idempotent credit consumption, restores and refunds. No credits may be granted solely from client assertions.

## Cutout data flow

1. The user enables consent and explicitly requests removal.
2. Only the normalized photo is uploaded to Laravel; name/team/game data stay local.
3. Laravel validates/rate-limits and passes the temporary photo to the configured provider.
4. A verified PNG is returned in a no-store response; the temporary server file is deleted.
5. Missing config, timeouts or invalid output preserve the original-photo workflow.

Replace the backend `BackgroundRemover` binding to use another segmentation service. Keys stay server-side. Third-party retention needs review before real-user deployment. Public paid API access requires authentication and stronger abuse controls.

## Extension points

Add typed document variants for matchup, spotlight and Senior Night. Keep sport graphics in renderer layers. Animated exports require a video renderer; they cannot come from PNG capture. Future accounts/team profiles should stay optional, with explicit upload consent and authenticated private cloud storage. Younger users require a separate age/parental-consent and privacy design.
