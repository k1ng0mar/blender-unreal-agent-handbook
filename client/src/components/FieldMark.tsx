const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export function fieldAsset(path: string) {
  return asset(path);
}

export function FieldMark({ className = "h-10 w-10 rounded-sm object-cover" }: { className?: string }) {
  return <img src={asset("images/field-engine-mark.png")} alt="" className={className} />;
}
