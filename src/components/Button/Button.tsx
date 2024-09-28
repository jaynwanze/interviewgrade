'use client';

type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export function Button({
  className: classNameProp,
  disabled: disabledProp,
  ...props
}: ButtonProps) {
  const disabled = disabledProp;
  const className = classNameProp;

  const buttonElement = (
    <button disabled={disabled} className={className} {...props}></button>
  );

  return buttonElement;
}
