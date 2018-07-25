const { getTaskListStatusFromComment } = require("./");

describe("comments", () => {
  describe("getTaskListStatusFromComment", () => {
    it("should return `error` if any of the tasks in the list are not complete", () => {
      const comment = `
                - [x] Finish my changes
                - [ ] Push my commits to GitHub
                - [ ] Open a pull request
            `;

      const result = getTaskListStatusFromComment(comment);
      expect(result).toBe("error");
    });

    it("should return `success` if all the taks in the list are complete", () => {
      const comment = `
        - [x] Finish my changes
        - [x] Push my commits to GitHub
        - [x] Open a pull request
    `;

      const result = getTaskListStatusFromComment(comment);
      expect(result).toBe("success");
    });
  });
});
