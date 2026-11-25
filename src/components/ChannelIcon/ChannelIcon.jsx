import React from 'react';
import SourceNews12Logo from '../../assets/source-news12.svg';
import SourceYnetLogo from '../../assets/source-ynet.svg';
// PNG logos from Figma (Source logo · Logo image): imported as a URL string.
import SourceIsraelHayomLogo from '../../assets/source-israelhayom.png';
import SourceHaaretzLogo from '../../assets/source-haaretz.png';

// Channel logos by channel name (the name as it appears in a mivzak's "source").
// To add a logo: add the channel's SVG or PNG file to src/assets, import it above and add it here.
// (SVG = React component, PNG = URL string; both are handled below.)
// ערוץ 14 and וויינט ספורט have no logo in the design yet – they show initials.
const channelLogos = {
  'חדשות 12': SourceNews12Logo,
  'וויינט': SourceYnetLogo,
  'ישראל היום': SourceIsraelHayomLogo,
  'הארץ': SourceHaaretzLogo,
};

// Shown in the circle when a channel has no logo file yet.
const channelInitials = {
  'וויינט ספורט': 'ס',
  'ישראל היום': 'יה',
  'חדשות 12': '12',
  'ערוץ 14': '14',
  'וויינט': 'וי',
  'הארץ': 'הא',
};

/**
 * The icon of a news channel, chosen by the channel name.
 * Uses the channel's logo (channelLogos above); without one, shows its initials.
 *
 * @example <ChannelIcon name="חדשות 12" className={styles.sourceLogo} />
 */
export function ChannelIcon({ name = '', className }) {
  const Logo = channelLogos[name];
  const initials = channelInitials[name] || name.slice(0, 2);

  let content = <span>{initials}</span>;
  if (typeof Logo === 'string') content = <img src={Logo} alt="" />;
  else if (Logo) content = <Logo />;

  return (
    <span className={className} aria-hidden="true">
      {content}
    </span>
  );
}

export default ChannelIcon;
