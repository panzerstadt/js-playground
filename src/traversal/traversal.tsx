import { displayDb, displayRelationships, traverse } from "@/programs/traversal";
import { useEffect, useState } from "react";
import useDebouncedEffect from "use-debounced-effect";

interface LabelerProps {
  onKey?: (k: string) => void;
  onValue?: (v: string) => void;
  pojo: Object;
}
export const Labeler: React.FC<LabelerProps> = ({ pojo, onKey, onValue }) => {
  const space = 20;
  const jsFormatted = eval("(" + pojo + ")");

  const jsxizer = (jsFormatted: Object, pad = 0, isLastInArray = false) => {
    const VComponent: React.FC<{ label: string }> = ({ label }) => (
      <span
        className="hover:text-sky-500 cursor-pointer"
        onClick={() => onValue?.(label)}
      >{`"${label}"`}</span>
    );

    if (typeof jsFormatted === "string") {
      return (
        <>
          <VComponent label={jsFormatted} />
          {!isLastInArray && <span>,</span>}
        </>
      );
    }

    return Object.entries(jsFormatted).map(([key, entry], i) => {
      const k = (
        <span key={i} onClick={() => onKey?.(key)} className="hover:text-orange-500 cursor-pointer">
          {key}:{" "}
        </span>
      );
      let v = <></>;

      switch (typeof entry) {
        case "string":
          v = <VComponent label={entry} />;
          break;
        case "object":
          if (Array.isArray(entry)) {
            v = (
              <>
                <span>{"["}</span>
                {entry.map((e, j) => {
                  if (typeof e === "object") {
                    return (
                      <div className="flex" style={{ marginLeft: pad }} key={j}>
                        <Labeler key={j} pojo={JSON.stringify(e)} onKey={onKey} onValue={onValue} />
                      </div>
                    );
                  }
                  return <div key={j}>{jsxizer(e, pad + space, j === entry.length - 1)}</div>;
                })}
                <span>{"]"}</span>
              </>
            );
          }
        default:
          break;
      }

      return (
        <div key={i} style={{ marginLeft: pad }}>
          {k}
          {v}
          <span>,</span>
        </div>
      );
    });
  };

  return (
    <ul>
      <li>{"{"}</li>
      {jsxizer(jsFormatted, space)}
      <li>{"},"}</li>
    </ul>
  );
};

export default function Traversal() {
  const [searchId, setSearchId] = useState("id1");
  const [searchCol, setSearchCol] = useState("reports");
  const [isDebug, setIsDebug] = useState(false);

  const [results, setResults] = useState<string[]>([]);

  useDebouncedEffect(
    () => {
      if (searchId && searchCol) {
        traverse(searchId, searchCol, isDebug).then((res) => {
          setResults(res);
        });
      }
    },
    300,
    [searchId, searchCol, isDebug]
  );

  return (
    <div className="h-screen w-full flex flex-col gap-6 items-center justify-center">
      <div className="flex flex-col">
        <div className="flex">
          <input
            placeholder="search id"
            onChange={(e) => setSearchId(e.target.value)}
            value={searchId}
            style={{ borderWidth: "2px 0 2px 2px" }}
            className="w-30 pl-2 border-sky-500 border rounded-l-lg"
          />
          <span className="border-l-2 border-zinc-400"></span>
          <input
            placeholder="db colleciton"
            onChange={(e) => setSearchCol(e.target.value)}
            value={searchCol}
            style={{ borderWidth: "2px 2px 2px 0" }}
            className="w-30 pl-2 border-orange-500 border rounded-r-lg"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <input type="checkbox" onChange={(e) => setIsDebug(e.target.checked)} />
          {isDebug ? "debug mode: check console." : "debug?"}
        </div>

        <code className="px-2 py-2 text-zinc-800 rounded-lg shadow-lg border mt-3">
          <span>starting from </span>
          <span className="text-sky-500">{searchId}</span>:
          <span className="text-orange-500">{searchCol}</span>
        </code>
      </div>

      <div className="relative h-4/6 grid sm:grid-cols-3 whitespace-pre gap-3 max-h-[600px] shadow-lg rounded-lg mx-6 border  overflow-hidden">
        <div className="sm:shadow-md border-b sm:border-b-0 p-6 max-h-[600px] overflow-auto ">
          <h1 className="font-medium absolute bg-white bg-opacity-80">DB</h1>
          <br />
          <Labeler
            pojo={displayDb}
            onValue={(v) => setSearchId(v)}
            onKey={(k) => setSearchCol(k)}
          />
        </div>
        <div className="sm:shadow-md  border-b sm:border-b-0 p-6 max-h-[600px] overflow-auto">
          <h1 className="font-medium absolute bg-white bg-opacity-80">Relationships</h1>
          {displayRelationships}
        </div>
        <div className="flex flex-col shadow-md p-6 max-h-[600px] overflow-auto">
          <h1 className="font-medium absolute bg-white bg-opacity-80">Traversed Output</h1>
          <br />
          {results.map((r, i) => {
            return <p key={i}>{r}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
