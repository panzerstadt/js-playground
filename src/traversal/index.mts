const DEBUG = true;

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

// go through all relationships, look for direct relationships to the root, in this case 'reports'
/**
 * instances
 *    projects
 *      reports
 *        creator
 *        teams
 *        visualization
 */
const bigdb = {
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

const db = {
  projects: [
    {
      name: "project 55",
      id: "id55",
      pages: ["id1"],
    },
  ],
  reports: [
    //TODO:
    /**
     * viz:id99
     *    reports:id1
     */
    {
      id: "id1",
      key: "foo",
      creator: "userA",
      teams: ["one", "two"],
      viz_id: "id99",
    },
    // {
    //   id: "id7",
    //   key: "foo",
    //   creator: "userD",
    //   teams: ["one"],
    //   viz_id: "id99",
    // },
  ],
  // visualizations: [
  //   {
  //     name: "visualization 99",
  //     id: "id99",
  //     creator: "id2",
  //     owners: ["userA", "userB"],
  //     reports: ["id1", "id7"],
  //   },
  //   {
  //     name: "visualization 88",
  //     id: "id88",
  //     creator: "id2b",
  //     owners: ["userA"],
  //     reports: ["id1"],
  //   },
  // ],
};

const query = (col) => {
  const intersectionBetweenArrays = (array1, array2) => array1.filter((x) => array2.includes(x));

  return {
    where(fieldType, searchValueOrValues) {
      const collection = db[col];

      let result = [];

      if (collection) {
        // console.log(`ORM: collection found: collection:${col} has ${collection[0].id}!`);
        // console.log(`ORM: query: where ${searchValueOrValues} in ${fieldType}`);
        result = collection.filter((doc) => {
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

let parentRootSearchCount = 0;
const resolveParents = async (searchId, searchCol, field = null, _parents = []) => {
  const relationshipEntryRefersToSearchCol = ([, collectionEntryOrValue]) => {
    let relCollection = "";
    if (typeof collectionEntryOrValue !== "string") {
      relCollection = collectionEntryOrValue.collection;
    } else {
      relCollection = collectionEntryOrValue;
    }

    return relCollection === searchCol;
  };
  // console.log(`resolving parents: id:${searchId}, col:${searchCol}`);
  const result = await query(searchCol).where("id", searchId).first();

  // if the result hits the original search id the second time, stop
  // const skip = result.id === _parent?.id || parentRootSearchCount > 1;
  if (_parents.length === 0) {
    _parents.push(result);
  }
  if (_parents.some((p) => p.id === result.id)) {
    parentRootSearchCount++;
  }

  // first level
  let accumulated: ParentResult = {
    document: result,
    parents: {},
  };

  const relationshipEntries = Object.entries(relationships);
  const bigPromises = relationshipEntries
    .filter(([parentCollection, entry]) => {
      const collectionRelationships = Object.entries(entry);

      const relatedToSearchCollection = collectionRelationships.filter(
        relationshipEntryRefersToSearchCol
      );

      const willTraverse = relatedToSearchCollection.length > 0;

      if (willTraverse && DEBUG) {
        console.log(
          `will traverse '${parentCollection}' because it uses '${searchCol}' in its field: ${relatedToSearchCollection.map(
            (entry) => `"${entry[0]}" refers to ${JSON.stringify(entry[1])} in ${parentCollection}`
          )}`
        );
      }

      return willTraverse;
    })

    .map(async ([parentCollection, entry]) => {
      const collectionRelationships = Object.entries(entry);
      const promises = collectionRelationships
        .filter(relationshipEntryRefersToSearchCol)
        .map(async ([fkName, collectionEntryOrValue]) => {
          let relField = null;
          if (typeof collectionEntryOrValue !== "string") {
            relField = collectionEntryOrValue.field;
          }

          // hydrate that relationship
          const searchTerm = result[relField] ?? searchId;
          const results = await query(parentCollection).where(fkName, searchTerm).get();
          if (results.length === 0) return null;

          const promises = results.map(async (res) => {
            // FIXME: hitting a loop
            if (_parents.some((p) => p.id === res.id)) {
              console.log(
                "HIT A LOOP",
                res.id,
                _parents.map((p) => p.id)
              );
              // console.log(
              //   "completing!",
              //   _parents.map((p) => p.id),
              //   result.id
              // );
              return { document: res, parents: {} } as ParentResult;
            }

            console.log("resolving one level up using", res);
            _parents.push(res);
            return {
              ...accumulated,
              parents: {
                ...accumulated.parents,
                [parentCollection]: await resolveParents(res.id, parentCollection, null, _parents),
              },
            };
            // return await resolveParents(res.id, parentCollection, null, _parents);
          });

          const subResults = (await Promise.all(promises)).filter(Boolean);
          // console.log("subREsults", subResults);
          if (subResults.length === 0) return null;
          return subResults;

          // accumulated = {
          //   ...accumulated,
          //   parents: {
          //     ...accumulated.parents,
          //     [parentCollection]: subResults,
          //   },
          // };
          // return accumulated;

          // }
        });

      const res = (await Promise.all(promises)).filter(Boolean);

      if (res.length === 0) return null;
      return res;
      // return res.filter(Boolean);
      return {
        ...accumulated,
        parents: {
          ...accumulated.parents,
          [parentCollection]: res,
        },
      };

      // }
    });

  const bigres = (await Promise.all(bigPromises)).filter(Boolean).filter((r) => r.length > 0);
  if (bigres.length === 0) return null;

  // console.log("WHAT is BIEGRES", JSON.stringify(bigres, null, 2));
  return bigres;
  return {
    ...accumulated,
    parents: {
      ...accumulated.parents,
      ["UHH"]: bigres,
    },
  };
  // return bigres.filter((r) => r.length > 0);
};

let childRootSearchCount = 0;
const resolveChildren = async (searchTermOrTerms, collection, field = null, _parent = null) => {
  const currentField = field || "id";
  const results = await query(collection).where(currentField, searchTermOrTerms).get();

  const promises = results.map(async (result) => {
    // if the result hits the original search id the second time, stop
    const skip = result.id === _parent?.id || childRootSearchCount > 1;
    if (_parent === null) {
      _parent = result;
    }
    if (result.id === _parent?.id) {
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
      if (!skip) {
        if (typeof mapping !== "string") {
          // object, handle
          subResults = await resolveChildren(
            value,
            mapping.collection,
            mapping.field,

            _parent
          );
        } else {
          // mapping is the child collection, value is the id
          subResults = await resolveChildren(value, mapping, null, _parent);
        }

        accumulated = {
          ...accumulated,
          children: {
            ...accumulated.children,
            [field]: subResults as ChildResult[],
          },
        };
      }
    }

    // DONE
    return accumulated;
  });

  return await Promise.all(promises);
};

const printTree = (result: BothResult, rootKey = "root", prevWidth = 0) => {
  let parentWidth = prevWidth;
  // print parent

  let padParentWidth = new Array(parentWidth).join(" ");
  let collection = ""; // TODO: (${collection})
  // print root
  console.log(`${padParentWidth}${rootKey}${collection}:${result.document.id}`);

  // print parents
  if (result.parents) {
    const parentEntries = Object.entries(result.parents);
    parentEntries.forEach(([key, results]) => {
      results.forEach((res) => printTree(res, key, parentWidth + 4));
    });
  }

  // print children
  if (result.children) {
    const childEntries = Object.entries(result.children);
    childEntries.forEach(([key, results]) => {
      results.forEach((res) => printTree(res, key, parentWidth + 8));
      // console.log(`${padParentWidth}${key}:${entry.document.id}`);
    });
  }
};

const searchId = "id1";
const searchCol = "reports";
// search...

Promise.all([resolveParents(searchId, searchCol), resolveChildren(searchId, searchCol)]).then(
  ([parents, children]) => {
    console.log(`parents: (... uses ${searchId}):`);
    // console.log(parents);
    console.log(JSON.stringify(parents, null, 2));
    // parents.forEach((res) => printTree(res));
    console.log("----------");
    console.log(`children: (${searchId} uses ...)`);
    console.log(children);
    // children.forEach((res) => printTree(res));
  }
);
