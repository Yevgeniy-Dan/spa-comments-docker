// --------------- DAG - Directed Acyclic Graph------------------
//
//         rootComment                      rootComment
//         /       \                      /             \
//     child1      child2            child3          child4
//        |          |               /     \             |
//  grandchild1      |      grandchild4   grandchild5  grandchild6
//                  / \
//        grandchild2  grandchild3

const CommentMap = require("./CommentMap");

const _CommentTree = (() => {
  class CommentTree {
    constructor() {
      this.comments = new CommentMap();
      this.replyIds = new Set();
    }

    addComment(comment) {
      const item = getObjectWithIdInReplySet(this.replyIds, comment.id);
      if (!item) {
        comment = { ...comment, parentId: null };
      } else {
        comment = { ...comment, parentId: item.parentId };
      }
      this.comments.set(comment, new Set());
    }

    addReplyIdObj(parentId, replyId) {
      this.replyIds.add({ parentId, replyId });
    }

    addEdge(parentId, childId) {
      if (!this.comments.hasById(parentId) || !this.comments.hasById(childId)) {
        throw new Error("One of the comment does not exist anymore.");
      }

      const childObj = this.comments.getKeyById(childId);

      this.comments.getById(parentId).add(childObj);
    }

    sort(sortBy, sortOrder) {
      const comments = CommentTree.sortComments(this.comments);

      // Create a map of each object's dependecies
      const dependencies = new Map();

      let predecessorId = comments[0].id;
      for (let i = 0; i < comments.length - 1; i++) {
        const isNextWithParentId = comments[i + 1].parentId;
        if (isNextWithParentId) {
          if (!dependencies.has(predecessorId)) {
            dependencies.set(predecessorId, []);
          }
          dependencies.get(predecessorId).push(comments[i + 1]);
        } else {
          predecessorId = comments[i + 1].id;
        }
      }

      let parentComments = comments.filter((c) => c.parentId === null);

      switch (sortBy) {
        case "date": {
          parentComments = CommentTree.sortByDate(parentComments, sortOrder);
          break;
        }
        case "email": {
          parentComments = CommentTree.sortByEmail(parentComments, sortOrder);
          break;
        }
        case "username": {
          parentComments = CommentTree.sortByUsername(
            parentComments,
            sortOrder
          );
          break;
        }
      }

      const result = [];

      for (const c of parentComments) {
        result.push(c);
        if (dependencies.has(c.id)) {
          result.push(...dependencies.get(c.id));
        }
      }

      return result;
    }
  }

  CommentTree.dfs = (node, graph, visited, result) => {
    visited[node.id] = true;
    const children = graph.getById(node.id) || [];

    if (children) {
      for (const child of children) {
        if (!visited[child.id]) {
          CommentTree.dfs(child, graph, visited, result);
        }
      }
    }

    result.push(node);
  };

  CommentTree.sortComments = (comments) => {
    const visited = {};
    const result = [];

    for (const comment of comments.keys()) {
      if (!visited[comment.id]) {
        CommentTree.dfs(comment, comments, visited, result);
      }
    }

    const orderedResult = [];
    const seen = new Set();

    for (let i = result.length - 1; i >= 0; i--) {
      const comment = result[i];
      if (!seen.has(comment.id)) {
        orderedResult.push(comment);
        seen.add(comment.id);
      }
    }

    return orderedResult;
  };

  CommentTree.topologicalSort = (comments) => {
    // Topological sort guarantees that the order is correct since the graph is acyclic (DAG)
    const visited = {};
    const result = [];

    function visit(comment) {
      if (visited[comment.id]) {
        return;
      }

      visited[comment.id] = true;
      const childComments = comments.getById(comment.id) || [];
      [...childComments].forEach(visit);
      result.unshift(comment);
    }

    [...comments.keys()].forEach(visit);

    return result;
  };

  CommentTree.sortByDate = (comments, order) => {
    //Sort build in method - Quick Sort has O(nlog(n)) Time Complexity
    comments.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

    if (order === "desc") {
      comments.reverse();
    }

    return comments;
  };

  CommentTree.sortByEmail = (comments, order) => {
    comments.sort(CommentTree.compareEmails);

    if (order === "desc") {
      comments.reverse();
    }

    return comments;
  };

  CommentTree.sortByUsername = (comments, order) => {
    comments.sort(CommentTree.compareUsernames);

    if (order === "desc") {
      comments.reverse();
    }

    return comments;
  };

  CommentTree.compareUsernames = (a, b) => {
    const nameA = a.userName.toUpperCase();
    const nameB = b.userName.toUpperCase();

    if (nameA < nameB) {
      return -1;
    }

    if (nameA > nameB) {
      return 1;
    }

    return 0;
  };

  CommentTree.compareEmails = (a, b) => {
    // The function works by comparing first domain names and then usernames
    // Time & Space Complexity === O(1)

    const [userA, domainA] = a.email.split("@");
    const [userB, domainB] = b.email.split("@");

    const domainComparison = domainA.localeCompare(domainB);

    if (domainComparison !== 0) {
      return domainComparison;
    }

    return userA.localeCompare(userB);
  };

  return CommentTree;
})();

module.exports = _CommentTree;

const getObjectWithIdInReplySet = (set, id) => {
  for (let item of set) {
    if (item.replyId === id) {
      return item;
    }
  }
  return null;
};
