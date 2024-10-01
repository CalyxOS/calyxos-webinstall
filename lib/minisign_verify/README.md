This is a partial implementation of minisign used to verify CalyxOS release signature

Key references used:

- jedisct1's minisign documentation https://jedisct1.github.io/minisign/

- chm-diederichs's javascript implementation:  https://github.com/chm-diederichs/minisign

- aead's Go implementation:  https://github.com/aead/minisign





``` js
import MinisignVerify from 'minisign_verify'

const isValid =  await MinisignVerify.verify(release, data)

```
