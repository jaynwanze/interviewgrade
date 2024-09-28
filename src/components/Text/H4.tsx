export default function H4({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const classes = ['text-md font-semibold text-foreground'];
  if (className) {
    classes.push(className);
  }
  return <h4 className={classes.join(' ')}>{children}</h4>;
}
