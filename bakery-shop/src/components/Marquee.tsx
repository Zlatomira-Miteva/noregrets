type MarqueeProps = {
  message?: string;
  repeat?: number;
  className?: string;
};

const DEFAULT_MESSAGE = "От фурната - направо до теб.";

const Marquee = ({ message = DEFAULT_MESSAGE, repeat = 8, className = "" }: MarqueeProps) => {
  const highlight = "с безплатна доставка.";

  const items = Array.from({ length: repeat }).map((_, index) => {
    const hasHighlight = message.includes(highlight);
    const [before = "", after = ""] = hasHighlight ? message.split(highlight) : [message, ""];

    return (
    <span key={index} className="marquee__item">
        {before}
        {hasHighlight ? <strong>{highlight}</strong> : null}
        {after}
    </span>
    );
  });
  

  return (
    <div className={`marquee ${className}`}>
      <div className="marquee__track">
        <div className="marquee__group">{items}</div>
        <div className="marquee__group" aria-hidden="true">
          {items}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
