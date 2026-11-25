import React from 'react';
import { ChannelLogos } from '../../assets';

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
 * Uses the channel's SVG logo from assets/index.js (ChannelLogos); without one, shows its initials.
 *
 * @example <ChannelIcon name="חדשות 12" className={styles.sourceLogo} />
 */
export function ChannelIcon({ name = '', className }) {
  const Logo = ChannelLogos[name];
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
