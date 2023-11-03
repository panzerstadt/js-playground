const DEBUG = false;

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

      if (DEBUG) {
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
              DEBUG &&
                console.log(`HIT A LOOP: ${result.id} found in [${_parents.map((p) => p.id)}]`);

              // return the duplicate (root) document with no parents
              return { document: result, parents: {} };
            }

            DEBUG && console.log("resolving one level up for the result", result);
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

  const parentEntries = resolvedParents.reduce((acc, parent) => {
    return { ...acc, ...parent };
  }, {});

  return {
    ...accumulated,
    parents: { ...accumulated.parents, ...parentEntries },
  } as ParentResult;
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
      // console.log("logging", key, results);
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
    // console.log(JSON.stringify(parents, null, 2));
    [parents].forEach((res) => printTree(res));
    console.log("----------");
    console.log(`children: (${searchId} uses ...)`);
    // console.log(children);
    children.forEach((res) => printTree(res));
  }
);
