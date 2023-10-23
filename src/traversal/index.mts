const relationships = {
  reports: {
    creator: { collection: "users", field: "name" },
    teams: { collection: "teams", field: "key" },
    viz_id: "visualizations",
  },
  visualizations: {
    creator: "users",
    owners: { collection: "users", field: "name" },
    report: "reports",
  },
  teams: {
    users: "users",
  },
};

const db = {
  reports: [
    {
      id: "1",
      key: "foo",
      creator: "userA",
      teams: ["one", "two"],
      viz_id: "99",
    },
  ],
  visualizations: [
    {
      id: "99",
      creator: "2",
      owners: ["userA", "userB"],
      report: "1",
    },
  ],
  teams: [
    {
      id: "3",
      key: "one",
      name: "Team One",
      users: ["2", "2b"],
    },
    {
      id: "4",
      key: "two",
      name: "Team Two",
      users: ["2c"],
    },
  ],
  users: [
    {
      id: "2",
      name: "userA",
    },
    {
      id: "2b",
      name: "userB",
    },
    {
      id: "2c",
      name: "userC",
    },
  ],
};

const query = (col) => {
  return {
    where(fieldType, searchValueOrValues) {
      const collection = db[col];

      let result = [];

      if (collection) {
        result = collection.filter((doc) => {
          if (Array.isArray(searchValueOrValues)) {
            return searchValueOrValues.includes(doc[fieldType]);
          }

          return doc[fieldType] === searchValueOrValues;
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

// TODO: resolve upward (parent)
const resolve = async (searchTermOrTerms, collection, field = null, _root = null) => {
  const currentField = field || "id";
  const results = await query(collection).where(currentField, searchTermOrTerms).get();

  const promises = results.map(async (result) => {
    const skip = result.id === _root?.id;
    if (_root === null) {
      _root = result;
    }

    // first level
    let accumulated = {
      document: result,
      children: {},
    };

    for (const field of Object.keys(result)) {
      const relationship = relationships[collection];
      if (!relationship) continue;

      const mapping = relationship[field];
      const value = result[field];

      if (!mapping) continue;

      let sub = {};
      if (!skip) {
        if (typeof mapping !== "string") {
          // object, handle
          sub = await resolve(value, mapping.collection, mapping.field, _root);
        } else {
          // mapping is the child collection, value is the id
          sub = await resolve(value, mapping, null, _root);
        }

        accumulated = {
          ...accumulated,
          children: {
            ...accumulated.children,
            [field]: sub,
          },
        };
      }
    }

    // DONE
    return accumulated;
  });

  return await Promise.all(promises);
};

const searchId = "1";
const searchCol = "reports";
// search...
// for each key in doc, look up relationship
resolve(searchId, searchCol).then((res) => {
  console.log("final result");
  console.log(JSON.stringify(res, null, 4));
});
