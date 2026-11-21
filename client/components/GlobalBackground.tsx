/**
 * The site-wide background image, rendered exactly once in the root layout.
 *
 * It is a fixed layer behind all content, so scrolling never moves it and
 * client-side route changes never remount or swap it.
 */
export default function GlobalBackground() {
  return <div aria-hidden="true" className="global-background" />;
}
