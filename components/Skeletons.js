export function Sk({ w = '100%', h = 76, r = 12, mt = 0 }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, marginTop: mt }} />;
}

export function ListSk({ rows = 3 }) {
  return Array.from({ length: rows }).map((_, i) => <Sk key={i} h={76} r={20} mt={10} />);
}

export function PageSk() {
  return (
    <>
      <Sk w="90px" h={16} r={8} />
      <Sk w="60%" h={44} r={12} mt={12} />
      <Sk w="45%" h={18} r={8} mt={12} />
      <div style={{ marginTop: 14 }}><ListSk rows={4} /></div>
    </>
  );
}

export function DocSk() {
  return (
    <>
      <Sk w="90px" h={16} r={8} />
      <Sk w="80%" h={40} r={12} mt={12} />
      <Sk h={150} r={22} mt={16} />
      <Sk w="190px" h={52} r={16} mt={18} />
      <Sk h={380} r={22} mt={18} />
    </>
  );
}
