type StackLogoProps = {
  onHoverChange: (hovered: boolean) => void
}

export function StackLogo({ onHoverChange }: StackLogoProps) {
  return (
    <img
      className="stack-logo"
      src="/stack.svg"
      alt="Stack"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    />
  )
}
