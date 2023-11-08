// @ts-nocheck
const relationships = {
  reports: {
    creator: { collection: "users", field: "name" },
    teams: { collection: "teams", field: "key" },
    viz_id: "visualizations",
  },
  visualizations: {
    creator: "users",
    owners: { collection: "users", field: "name" },
    reports: "reports",
  },
  teams: {
    users: "users",
  },
  projects: {
    pages: "reports",
  },
  instances: {
    projects: { collection: "projects", field: "name" },
  },
} as const;

export const displayRelationships = `
{
    reports: {
      creator: { collection: "users", field: "name" },
      teams: { collection: "teams", field: "key" },
      viz_id: "visualizations",
    },
    visualizations: {
      creator: "users",
      owners: { collection: "users", field: "name" },
      reports: "reports",
    },
    teams: {
      users: "users",
    },
    projects: {
      pages: "reports",
    },
    instances: {
      projects: { collection: "projects", field: "name" },
    },
}
`;

// go through all relationships, look for direct relationships to the root, in this case 'reports'
/**
 * instances
 *    projects
 *      reports
 *        creator
 *        teams
 *        visualization
 */
const db = {
  instances: [
    {
      id: "root-parent-id",
      projects: ["project 55"],
    },
  ],
  projects: [
    {
      name: "project 55",
      id: "id55",
      pages: ["id1"],
    },
  ],
  reports: [
    {
      id: "id1",
      key: "foo",
      creator: "userA",
      teams: ["one", "two"],
      viz_id: "id99",
    },
    {
      id: "id7",
      key: "foo",
      creator: "userD",
      teams: ["one"],
      viz_id: "id99",
    },
  ],
  visualizations: [
    {
      name: "visualization 99",
      id: "id99",
      creator: "id2",
      owners: ["userA", "userB"],
      reports: ["id1", "id7"],
    },
    {
      name: "visualization 88",
      id: "id88",
      creator: "id2b",
      owners: ["userA"],
      reports: ["id1"],
    },
  ],
  teams: [
    {
      id: "id3",
      key: "one",
      name: "Team One",
      users: ["id2", "id2b"],
    },
    {
      id: "id4",
      key: "two",
      name: "Team Two",
      users: ["id2c"],
    },
  ],
  users: [
    {
      id: "id2",
      name: "userA",
    },
    {
      id: "id2b",
      name: "userB",
    },
    {
      id: "id2c",
      name: "userC",
    },
  ],
};

export const displayDb = `
{
    instances: [
      {
        id: "root-parent-id",
        projects: ["project 55"],
      },
    ],
    projects: [
      {
        name: "project 55",
        id: "id55",
        pages: ["id1"],
      },
    ],
    reports: [
      {
        id: "id1",
        key: "foo",
        creator: "userA",
        teams: ["one", "two"],
        viz_id: "id99",
      },
      {
        id: "id7",
        key: "foo",
        creator: "userD",
        teams: ["one"],
        viz_id: "id99",
      },
    ],
    visualizations: [
      {
        name: "visualization 99",
        id: "id99",
        creator: "id2",
        owners: ["userA", "userB"],
        reports: ["id1", "id7"],
      },
      {
        name: "visualization 88",
        id: "id88",
        creator: "id2b",
        owners: ["userA"],
        reports: ["id1"],
      },
    ],
    teams: [
      {
        id: "id3",
        key: "one",
        name: "Team One",
        users: ["id2", "id2b"],
      },
      {
        id: "id4",
        key: "two",
        name: "Team Two",
        users: ["id2c"],
      },
    ],
    users: [
      {
        id: "id2",
        name: "userA",
      },
      {
        id: "id2b",
        name: "userB",
      },
      {
        id: "id2c",
        name: "userC",
      },
    ],
}
`;

const query = (col: string) => {
  const intersectionBetweenArrays = (array1: any[], array2: string | any[]) =>
    array1.filter((x: any) => array2.includes(x));

  return {
    where(fieldType: string, searchValueOrValues: string | any[]) {
      const collection = db[col];

      let result: any[] = [];

      if (collection) {
        // console.log(`ORM: collection found: collection:${col} has ${collection[0].id}!`);
        // console.log(`ORM: query: where ${searchValueOrValues} in ${fieldType}`);
        result = collection.filter((doc: { [x: string]: any }) => {
          const valueOrValuesInCollection = doc[fieldType];
          // console.log("doc fieltype", doc, fieldType, doc[fieldType]);
          if (Array.isArray(searchValueOrValues)) {
            if (Array.isArray(valueOrValuesInCollection)) {
              // search term: string[], value: string[]
              const values = valueOrValuesInCollection;
              return intersectionBetweenArrays(searchValueOrValues, values);
            }
            // search term: string[], value: string
            const value = valueOrValuesInCollection;
            return searchValueOrValues.includes(value);
          } else {
            // console.log(
            //   "searching",
            //   typeof valueOrValuesInCollection,
            //   valueOrValuesInCollection,
            //   typeof searchValueOrValues,
            //   searchValueOrValues
            // );
            if (Array.isArray(valueOrValuesInCollection)) {
              // search term: string, value: string[]
              const values = valueOrValuesInCollection;
              return values.includes(searchValueOrValues);
            }

            // search term: string, value: string
            const value = valueOrValuesInCollection;
            // console.log("compariing", value, searchValueOrValues, value === searchValueOrValues);
            return value === searchValueOrValues;
          }
        });

        // console.log("so result is", result);
      }

      return {
        first() {
          return result[0];
        },
        get() {
          return result;
        },
      };
    },
  };
};

interface BaseResult {
  document: { [key in string]: string };
}

interface ParentResult extends BaseResult {
  parents: { [key in string]: ParentResult[] };
}

interface ChildResult extends BaseResult {
  children: { [key in string]: ChildResult[] };
}

interface BothResult extends BaseResult {
  parents?: { [key in string]: BothResult[] };
  children?: { [key in string]: BothResult[] };
}

let __parentloop = 0;
let parentRootSearchCount = 0;
const resolveParents = async (
  searchId: string,
  searchCol: string,
  field = null,
  _parents = [],
  debug?: boolean
) => {
  __parentloop++;
  if (__parentloop > 10000) {
    throw new Error("infinite loop detected at resolveParents()");
  }
  const relationshipEntryRefersToSearchCol = ([, collectionEntryOrValue]) => {
    let relCollection = "";
    if (typeof collectionEntryOrValue !== "string") {
      relCollection = collectionEntryOrValue.collection;
    } else {
      relCollection = collectionEntryOrValue;
    }

    return relCollection === searchCol;
  };
  const rootDocument = await query(searchCol).where("id", searchId).first();

  if (_parents.length === 0) {
    _parents.push(rootDocument);
  }
  if (_parents.some((p) => p.id === rootDocument.id)) {
    parentRootSearchCount++;
  }

  // first level
  let accumulated: ParentResult = {
    document: rootDocument,
    parents: {},
  };

  const relationshipEntries = Object.entries(relationships);
  const parentPromises = relationshipEntries
    .filter(([parentCollection, parentRelationships]) => {
      const parentCollectionRelationships = Object.entries(parentRelationships);

      const relatedToSearchCollection = parentCollectionRelationships.filter(
        relationshipEntryRefersToSearchCol
      );

      const willTraverse = relatedToSearchCollection.length > 0;

      if (debug) {
        if (willTraverse) {
          console.log(
            `will traverse '${parentCollection}' because it uses '${searchCol}' in its field: ${relatedToSearchCollection.map(
              (entry) =>
                `"${entry[0]}" refers to ${JSON.stringify(entry[1])} in ${parentCollection}`
            )}`
          );
        } else {
          console.log(
            `will not traverse '${parentCollection}' because no relationship found with '${searchCol}'`
          );
        }
      }

      return willTraverse;
    })
    .map(async ([parentCollection, parentRelationships]) => {
      const parentCollectionRelationships = Object.entries(parentRelationships);
      const relationshipPromises = parentCollectionRelationships
        .filter(relationshipEntryRefersToSearchCol)
        /**
         * e.g. for the following relationship:
         * reports: { creator: { collection: "users", field: "name" }}
         * fkName == creator
         * relationshipEntryOrValue = { collection: "users", field: "name" }
         */
        .map(async ([fkName, relationshipEntryOrValue]) => {
          let relField = null;
          if (typeof relationshipEntryOrValue !== "string") {
            relField = relationshipEntryOrValue.field;
          }

          // hydrate that relationship
          const searchTerm = rootDocument[relField] ?? searchId;
          const results = await query(parentCollection).where(fkName, searchTerm).get();
          if (results.length === 0) return { [parentCollection]: [] } as ParentResult["parents"];

          const parentsPromises = results.map(async (result) => {
            const skip = _parents.some((p) => p.id === result.id) && parentRootSearchCount > 1;
            if (skip) {
              debug &&
                console.log(`HIT A LOOP: ${result.id} found in [${_parents.map((p) => p.id)}]`);

              // return the duplicate (root) document with no parents
              return { document: result, parents: {} };
            }

            debug && console.log("resolving one level up for the result", result);
            _parents.push(result);

            return await resolveParents(result.id, parentCollection, null, _parents);
          });

          const parentResults = await Promise.all(parentsPromises);

          return {
            [parentCollection]: parentResults,
          } as ParentResult["parents"];
        });

      const parents = (await Promise.all(relationshipPromises)).reduce((acc, current) => {
        const [parentCollectionKey] = Object.keys(current);
        if (acc[parentCollectionKey]) {
          acc[parentCollectionKey].push(...current[parentCollectionKey]);
        } else {
          acc[parentCollectionKey] = current[parentCollectionKey];
        }

        return acc;
      }, {});

      return parents as ParentResult["parents"];
    });

  const resolvedParents = await Promise.all(parentPromises);
  if (resolvedParents.length === 0) return accumulated;

  const parentEntries = resolvedParents.reduce((acc: any, parent: any) => {
    return { ...acc, ...parent };
  }, {});

  return {
    ...accumulated,
    parents: { ...accumulated.parents, ...parentEntries },
  } as ParentResult;
};

let __childrenloop = 0;
let childRootSearchCount = 0;
const resolveChildren = async (
  searchTermOrTerms: string,
  collection: string,
  field = null,
  _parents = [],
  debug?: boolean
) => {
  __childrenloop++;
  if (__childrenloop > 10000) {
    throw new Error("infinite loop detected at resolveChildren()");
  }
  const currentField = field || "id";
  const results = await query(collection).where(currentField, searchTermOrTerms).get();

  const promises = results.map(async (result) => {
    // if the result hits the original search id the second time, stop
    // console.log("parents", _parents);
    if (_parents.length === 0) {
      _parents.push(result);
    }
    if (_parents.some((p) => p.id === result.id)) {
      childRootSearchCount++;
    }

    // first level
    let accumulated: ChildResult = {
      document: result,
      children: {},
    };

    for (const field of Object.keys(result)) {
      const relationship = relationships[collection];
      if (!relationship) continue;

      const mapping = relationship[field];
      const value = result[field];

      if (!mapping) continue;

      let subResults = [];
      const skip = _parents.some((p) => p.id === result.id) && childRootSearchCount > 1;
      if (!skip) {
        _parents.push(result);
        if (typeof mapping !== "string") {
          // object, handle
          subResults = await resolveChildren(value, mapping.collection, mapping.field, _parents);
        } else {
          // mapping is the child collection, value is the id
          subResults = await resolveChildren(value, mapping, null, _parents);
        }

        accumulated = {
          ...accumulated,
          children: {
            ...accumulated.children,
            [field]: subResults as ChildResult[],
          },
        };
      } else {
        debug && console.log(`HIT A LOOP: ${result.id} found in [${_parents.map((p) => p.id)}]`);
      }
    }

    // DONE
    return accumulated;
  });

  return await Promise.all(promises);
};

const prettifyTree = (acc = null, result: BothResult, rootKey = "root", prevWidth = 0) => {
  let parentWidth = prevWidth;
  // print parent

  let padParentWidth = new Array(parentWidth).join(" ");
  let collection = "";
  // print root
  let output = `${padParentWidth}${rootKey}${collection}:${result.document.id}\n`;

  // print parents
  if (result.parents) {
    const parentEntries = Object.entries(result.parents);
    output += parentEntries
      .map(([key, results]) =>
        results.map((res) => prettifyTree(output, res, key, parentWidth + 8)).join("")
      )
      .join("");
  }

  // print children
  if (result.children) {
    const childEntries = Object.entries(result.children);
    output += childEntries
      .map(([key, results]) =>
        results.map((res) => prettifyTree(output, res, key, parentWidth + 8)).join("")
      )
      .join("");
  }

  return output;
};

export const traverse = async (searchId, searchCol, debug?: boolean) => {
  debug && console.log(`-------------TRAVERSAL START:-------------`);
  __parentloop = 0;
  __childrenloop = 0;
  childRootSearchCount = 0;
  parentRootSearchCount = 0;

  return await Promise.all([
    resolveParents(searchId, searchCol, null, [], debug),
    resolveChildren(searchId, searchCol, null, [], debug),
  ])
    .then(([parents, children]) => {
      let output = [];
      output.push(`parents - documents depending on '${searchId}':\n`);
      output.push(...prettifyTree(null, parents).split("\n"));
      output.push("----------\n");
      output.push(`children - '${searchId}' depends on these documents':\n`);
      const child = children[0];
      console.log("parents, children", parents, child);
      output.push(...prettifyTree(null, child).split("\n"));

      return output;
    })
    .catch((e) => {
      return [e.message];
    });
};
