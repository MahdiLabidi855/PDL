export default function Loading({ text = "Loading..." }) {
  return (
    <div className="card">
      <p>{text}</p>
    </div>
  );
}