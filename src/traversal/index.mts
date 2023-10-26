const relationships = {
  reports: {
    creator: { collection: "users", field: "name" },
    teams: { collection: "teams", field: "key" },
    viz_id: "visualizations",
  },
  visualizations: {
    creator: "users",
    owners: { collection: "users", field: "name" },
    // reports: "reports", // FIXME: solve loopback
  },
  teams: {
    users: "users",
  },
  projects: {
    pages: "reports",
  },
  instances: {
    projects: "projects",
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
      id: "xxx",
      projects: ["id55"],
    },
  ],
  projects: [
    {
      name: "project 55",
      id: "id55",
      reports: ["id1"],
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
        // console.log("ORM: collection found: ", col, collection[0].id);
        // console.log(`ORM: query is: where ${fieldType} in ${searchValueOrValues}`);
        result = collection.filter((doc) => {
          // console.log("doc fieltype", doc, fieldType, doc[fieldType]);
          if (Array.isArray(searchValueOrValues)) {
            if (Array.isArray(doc[fieldType])) {
              // search term: string[], value: string[]
              return intersectionBetweenArrays(searchValueOrValues, doc[fieldType]);
            }
            // search term: string[], value: string
            return searchValueOrValues.includes(doc[fieldType]);
          } else {
            if (Array.isArray(doc[fieldType])) {
              // search term: string, value: string[]
              return doc[fieldType].includes(searchValueOrValues);
            }

            // search term: string, value: string
            return doc[fieldType] === searchValueOrValues;
          }
        });
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
const resolveParents = async (searchId, searchCol, field = null, _parent = null) => {
  // console.log(`resolving parents: id:${searchId}, col:${searchCol}`);
  const rootDocument = await query(searchCol).where("id", searchId).first();

  // first level
  let accumulated: ParentResult = {
    document: rootDocument,
    parents: {},
  };
  // loop through relationships
  const colEntries = Object.entries(relationships);

  for (const [parentCollection, entry] of colEntries) {
    const collectionRelationships = Object.entries(entry);

    for (const [fkName, collectionEntryOrValue] of collectionRelationships) {
      let relCollection = "";
      if (typeof collectionEntryOrValue !== "string") {
        relCollection = collectionEntryOrValue.collection;
      } else {
        relCollection = collectionEntryOrValue;
      }

      if (relCollection === searchCol) {
        // field = what this collection calls the related document
        // console.log(
        //   `\nfound relationship: ${parentCollection} -> ${relCollection} (aliased as: ${fkName})`
        // );

        // hydrate that relationship
        const results = await query(parentCollection).where(relCollection, searchId).get();

        const promises = results.map(async (res) => {
          return await resolveParents(res.id, parentCollection);
        });

        const subResults = await Promise.all(promises);

        accumulated = {
          ...accumulated,
          parents: {
            ...accumulated.parents,
            [parentCollection]: subResults,
          },
        };
        return accumulated;
      }
    }
  }

  return accumulated;
};

let rootSearchCount = 0;
const resolveChildren = async (searchTermOrTerms, collection, field = null, _parent = null) => {
  const currentField = field || "id";
  const results = await query(collection).where(currentField, searchTermOrTerms).get();

  const promises = results.map(async (result) => {
    // if the result hits the original search id the second time, stop
    const skip = result.id === _parent?.id || rootSearchCount > 1;
    if (_parent === null) {
      _parent = result;
    }
    if (result.id === _parent?.id) {
      rootSearchCount++;
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
    console.log("parents:");
    [parents].forEach((res) => printTree(res));
    console.log("----------");
    console.log("children:");
    children.forEach((res) => printTree(res));
  }
);
