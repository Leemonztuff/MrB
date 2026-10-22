import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'CenturyGothic',
  fonts: [
    { src: '/fonts/CenturyGothicPaneuropeanRegular.ttf', fontWeight: 'normal' },
    { src: '/fonts/CenturyGothicPaneuropeanBold.ttf', fontWeight: 'bold' },
    { src: '/fonts/CenturyGothicPaneuropeanBlack.ttf', fontWeight: 900 },
  ],
});
