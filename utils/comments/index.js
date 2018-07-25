const getTaskListStatusFromComment = comment => {
  if (comment.indexOf("- [ ]") > -1) {
    return "error";
  }
  return "success";
};

module.exports = {
  getTaskListStatusFromComment
};
