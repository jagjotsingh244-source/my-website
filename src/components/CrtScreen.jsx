import '@fontsource/vt323'

// The blue "CLICK TO ENTER" screen, rebuilt in HTML so it stays sharp at any zoom.
// Colours sampled from the room image.
export default function CrtScreen() {
  return (
    <div className="crt">
      <div className="crt-ch">CH 08</div>
      <div className="crt-title">CLICK TO ENTER</div>
      <div className="crt-bar">
        <span className="crt-blocks">{'▮'.repeat(24)}</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// Sits on top of whatever is on the screen: edge shadow from the bezel,
// a faint reflection of the room on the glass, and fine grain to match the photo.
export function ScreenGlass() {
  return <div className="screen-glass" aria-hidden="true" />
}
