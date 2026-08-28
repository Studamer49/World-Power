type Props = { label?: string };

export default function Spinner({ label = 'Loading' }: Props) {
  return (
    <div className="loading-wrap">
      <div className="pl" aria-label={label}>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__text">{label}</div>
      </div>
    </div>
  );
}
