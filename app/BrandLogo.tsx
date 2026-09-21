/** Display the supplied artwork without the surrounding 1920×1080 canvas. */
export default function BrandLogo() {
  return <img src="/logo.webp" alt="NEWS24x7 INDIA" width="392" height="106" style={{width: '100%', height: 'auto'}} fetchPriority="high" decoding="sync" />;
}
