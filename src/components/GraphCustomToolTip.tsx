export const customTooltip = (props) => {
  const { payload, active } = props;
  if (!active || !payload) return null;
  console.log(payload);
  return (
    <div className="w-56 flex flex-col gap-2 bg-dark-tremor-background-muted rounded-tremor-default p-2 shadow-dark-tremor-dropdown border">
      {payload.map((category, idx) => (
        <div key={idx} className="flex flex-1 space-x-2.5">
          <div className={`w-1 flex flex-col bg-${category.color} rounded`} />
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">{category.dataKey}</p>
            <p className="font-medium text-dark-tremor-content-emphasis text-sm">
              {category.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
