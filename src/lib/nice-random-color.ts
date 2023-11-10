// from https://gist.github.com/bendc/76c48ce53299e6078a76
export const niceRandomColor = (() => {
  "use strict"

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  return () => {
    var h = randomInt(0, 360)
    var s = randomInt(42, 98)
    var l = randomInt(40, 90)
    return `hsl(${h},${s}%,${l}%)`
  }
})()

// from https://stackoverflow.com/a/64090995
export const hsl2rgb = (h: number, s: number, l: number) => {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [255 * f(0), 255 * f(8), 255 * f(4)]
}


// from https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color?rq=2#comment67563114_3943023
export const getTextColor = (hsl?: string) => {
  if (!hsl) return
  const threshold = 149
  const hslParts = hsl.replace('hsl(', '').replace(')', '').split(',')
  let rgb = hsl2rgb(parseInt(hslParts[0], 10), parseInt(hslParts[1], 10), parseInt(hslParts[2], 10))
  return ((rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) > threshold) ? '#000000' : '#ffffff'
}
