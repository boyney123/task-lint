const base64 = require("base-64");
const { getTaskListStatusFromComment } = require("./utils/comments");

const checkLists = async (context = {}) => {
  const { pull_request: { head = {}, number } = {}, repository: { owner: { login: owner } = {}, name: repo } = {} } = context.payload;

  const { data: comments = [] } = await context.github.issues.getComments({ owner, repo, number });

  const commentsHaveItemsThatAreNotChecked = comments.some(({ body = "" }) => {
    return getTaskListStatusFromComment(body) !== "success";
  });

  const state = commentsHaveItemsThatAreNotChecked ? "failure" : "success";

  const status = {
    owner,
    repo,
    sha: head.sha,
    state,
    description: state !== "success" ? "Please make sure all tasks in the comments are complete" : "All tasks in comments complete",
    context: "TaskLint"
  };
  const result = await context.github.repos.createStatus(status);
  return result;
};

module.exports = app => {
  app.on(["pull_request.opened", "pull_request.edited", "pull_request.synchronize"], async context => {
    await checkLists(context);
  });

  app.on(["issue_comment.edited"], async context => {
    const { issue: { number } = {}, repository = {} } = context.payload;
    const {
      owner: { login: owner },
      name: repo
    } = repository;
    const { data = {} } = await context.github.pullRequests.get({ owner, repo, number });

    checkLists({
      payload: {
        pull_request: {
          head: data.head,
          number
        },
        repository
      },
      github: context.github
    });
  });
};
