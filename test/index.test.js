// Requiring probot allows us to initialize an application
const { Application } = require("probot");
// Requiring our app implementation
const plugin = require("../");
// Create a fixtures folder in your test folder
// Then put any larger testing payloads in there
const issueCommentEvent = require("./events/issue-edited");
const pullRequestOpenedEvent = require("./events/pull-request-opened");

const config = {
  content: Buffer.from(
    `
    issueOpened: My Message

    pullRequestOpened: My Message  
  `
  ).toString("base64")
};

describe("task-list-checker", () => {
  let app;
  let github;

  beforeEach(() => {
    app = new Application();

    github = {
      repos: {
        createStatus: jest.fn()
      },
      pullRequests: {
        get: jest.fn(() => ({
          data: {
            head: {
              sha: "randomSha"
            }
          }
        }))
      },
      issues: {
        getComments: jest.fn(() => ({
          data: []
        }))
      }
    };

    app.auth = () => Promise.resolve(github);
    app.load(plugin);
  });

  describe("pull_request.opened", () => {
    it("Checks the comments of the pull request and creates a new status marked as `success` is no comments can be found with any tasks incomplete", async () => {
      await app.receive({ event: "pull_request", payload: pullRequestOpenedEvent });

      expect(github.repos.createStatus).toHaveBeenCalledWith({
        context: "TaskLint",
        description: "All tasks in comments complete",
        owner: "boyney123",
        repo: "test",
        sha: "randomSha",
        state: "success"
      });
    });

    it("Checks the comments of the pull request and creates a new status marked as `failure` if a comment is found with incomplete tasks", async () => {
      github = {
        repos: {
          createStatus: jest.fn()
        },
        issues: {
          getComments: jest.fn(() => ({
            data: [{ body: "- [ ]" }]
          }))
        }
      };

      await app.receive({ event: "pull_request", payload: pullRequestOpenedEvent });

      expect(github.issues.getComments).toHaveBeenCalledWith({
        owner: "boyney123",
        number: 19,
        repo: "test"
      });

      expect(github.repos.createStatus).toHaveBeenCalledWith({
        context: "TaskLint",
        description: "Please make sure all tasks in the comments are complete",
        owner: "boyney123",
        repo: "test",
        sha: "randomSha",
        state: "failure"
      });
    });
  });

  describe("issue_comment.edited", () => {
    it("Makes a request to get the pull request the issue came from", async () => {
      await app.receive({ event: "issue_comment", payload: issueCommentEvent });

      expect(github.pullRequests.get).toHaveBeenCalledWith({
        number: 19,
        owner: "boyney123",
        repo: "test"
      });
    });

    it("Uses the data from the issue event and makes a request to get the pull request comments, if no comments with lists are found sets status as `success`", async () => {
      await app.receive({ event: "issue_comment", payload: issueCommentEvent });

      expect(github.repos.createStatus).toHaveBeenCalledWith({
        context: "TaskLint",
        description: "All tasks in comments complete",
        owner: "boyney123",
        repo: "test",
        sha: "randomSha",
        state: "success"
      });
    });

    it("Uses the data from the issue event and makes a request to get the pull request comments, if comments with tasks are incomplete sets status as `failure`", async () => {
      github = {
        repos: {
          createStatus: jest.fn()
        },
        pullRequests: {
          get: jest.fn(() => ({
            data: {
              head: {
                sha: "randomSha"
              }
            }
          }))
        },
        issues: {
          getComments: jest.fn(() => ({
            data: [{ body: "- [ ]" }]
          }))
        }
      };

      await app.receive({ event: "issue_comment", payload: issueCommentEvent });

      expect(github.repos.createStatus).toHaveBeenCalledWith({
        context: "TaskLint",
        description: "Please make sure all tasks in the comments are complete",
        owner: "boyney123",
        repo: "test",
        sha: "randomSha",
        state: "failure"
      });
    });
  });
});
