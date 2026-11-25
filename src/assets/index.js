// Every icon is an SVG imported as a React component (@svgr/webpack, see webpack.config.js):
//   import { LiveDotIcon } from '../../assets';
//   <LiveDotIcon className={styles.liveDot} width={6} height={6} aria-hidden="true" />
import SourceNews12Logo from './source-news12.svg';
import SourceYnetLogo from './source-ynet.svg';
// PNG logos from Figma (Source logo · Logo image): imported as a URL string.
import SourceIsraelHayomLogo from './source-israelhayom.png';
import SourceHaaretzLogo from './source-haaretz.png';

export { default as LiveDotIcon } from './live-dot.svg';
export { default as SeparatorIcon } from './separator.svg';
export { default as TickerPlayIcon } from './ticker-play.svg';

export { default as AllNewsSearchIcon } from './all-news-search.svg';
export { default as AllNewsArrowUpIcon } from './all-news-arrow-up.svg';
export { default as AllNewsDotIcon } from './all-news-dot.svg';
export { default as AllNewsMarkerIcon } from './all-news-marker.svg';
export { default as AllNewsAllSourcesIcon } from './all-news-all-sources.svg';
export { default as AllNewsEmptyStateIcon } from './all-news-empty-state.svg';
export { default as AllNewsNoFlashesIcon } from './all-news-no-flashes.svg';
export { default as AllNewsOfflineIcon } from './all-news-offline.svg';
export { default as AllNewsToggleIcon } from './all-news-toggle.svg';
export { default as AllNewsPlayIcon } from './all-news-play.svg';
export { default as AllNewsLiveIcon } from './all-news-live.svg';
export { default as AllNewsSectionIcon } from './all-news-section.svg';
export { default as AllNewsUrgentDotIcon } from './all-news-urgent-dot.svg';

export { SourceNews12Logo, SourceYnetLogo };

// Channel logos by channel name (the name as it appears in a mivzak's "source").
// To add a logo: add the channel's SVG or PNG file to this folder, import it above and add it here.
// (SVG = React component, PNG = URL string; ChannelIcon handles both.)
// ערוץ 14 and וויינט ספורט have no logo in the design yet – they show initials.
export const ChannelLogos = {
  'חדשות 12': SourceNews12Logo,
  'וויינט': SourceYnetLogo,
  'ישראל היום': SourceIsraelHayomLogo,
  'הארץ': SourceHaaretzLogo,
};
