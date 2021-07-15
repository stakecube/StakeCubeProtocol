# Contributing to StakeCube Protocol

The StakeCube Protocol project operates an open contributor model where anyone is welcome to contribute towards development in the form of review, testing and patches. This document explains the practical process and guidelines for contributing.

Firstly in terms of structure, there is no particular concept of "Core developers" in the sense of privileged people. Open source often naturally revolves around meritocracy where longer term contributors gain more trust from the developer community. However, some hierarchy is necessary for practical purposes. As such there are repository "maintainers" who are responsible for merging pull requests as well as a "lead maintainer" who is responsible for the release cycle, overall merging, moderation and appointment of maintainers.

## Contributor Workflow

The codebase is maintained using the "contributor workflow" where everyone without exception contributes patch proposals using "pull requests". This facilitates social contribution, easy testing and peer review.

To contribute a patch, the workflow is as follows:

  1. Fork repository
  2. Create topic branch
  3. Commit patches

In general [commits should be atomic](https://en.wikipedia.org/wiki/Atomic_commit#Atomic_commit_convention) and diffs should be easy to read. For this reason do not mix any formatting
fixes or code moves with actual code changes.

Commit messages should be verbose by default consisting of a short subject line (50 chars max), a blank line and detailed explanatory text as separate paragraph(s), unless the title alone is self-explanatory (like "Corrected typo in index.js") in which case a single title line is sufficient. Commit messages should be helpful to people reading your code in the future, so explain the reasoning for your decisions.

If a particular commit references another issue, please add the reference. For example: `refs #1234` or `fixes #4321`. Using the `fixes` or `closes` keywords will cause the corresponding issue to be closed when the pull request is merged.

Commit messages should never contain any `@` mentions.

Please refer to the [Git manual](https://git-scm.com/doc) for more information about Git.

  - Push changes to your fork
  - Create pull request

The title of the pull request should be prefixed by the component or area that the pull request affects.

Examples:

- [SCP] Add new protocol standard
- [API] Add activity endpoint
- [UI] Hide empty wallets by default
- [Trivial] Fix typo in index.js

If a pull request is not to be considered for merging (yet), please prefix the title with [WIP] or use [Tasks Lists](https://help.github.com/articles/basic-writing-and-formatting-syntax/#task-lists) in the body of the pull request to indicate tasks are pending.

The body of the pull request should contain enough description about what the patch does together with any justification/reasoning. You should include references to any discussions (for example other tickets or mailing list discussions).

At this stage one should expect comments and review from other contributors. You can add more commits to your pull request by committing them locally and pushing to your fork until you have satisfied all feedback.

Note: Code review is a burdensome but important part of the development process, and as such, certain types of pull requests are rejected. In general, if the improvements do not warrant the review effort required, the PR has a high chance of being rejected. It is up to the PR author to convince the reviewers that the changes warrant the review effort, and if reviewers are "Concept NAK'ing" the PR, the author may need to present arguments and/or do research backing their suggested changes.

## Pull Request Philosophy

Patchsets should always be focused. For example, a pull request could add a feature, fix a bug, or refactor code; but not a mixture. Please also avoid super pull requests which attempt to do too much, are overly large, or overly complex as this makes review difficult.

### Features

When adding a new feature, thought must be given to the long term technical debt and maintenance that feature may require after inclusion. Before proposing a new feature that will require maintenance, please consider if you are willing to maintain it (including bug fixing). If features get orphaned with no maintainer in the future, they may be removed by the Repository Maintainer.

### Refactoring

Refactoring is a necessary part of any software project's evolution. The following guidelines cover refactoring pull requests for the project.

There are three categories of refactoring, code only moves, code style fixes, code refactoring. In general refactoring pull requests should not mix these three kinds of activity in order to make refactoring pull requests easy to review and uncontroversial. In all cases, refactoring PRs must not change the behaviour of code within the pull request (bugs must be preserved as is).

Project maintainers aim for a quick turnaround on refactoring pull requests, so where possible keep them short, uncomplex and easy to verify.

Pull requests that refactor the code should not be made by new contributors. It requires a certain level of experience to know where the code belongs and to understand the full ramification (including rebase effort of open pull requests). Trivial pull requests or pull requests that refactor the code with no clear benefits may be immediately closed by the maintainers to reduce unnecessary workload on reviewing.


### "Decision Making" Process

Whether a pull request is merged into SCP rests with the project merge maintainers and ultimately the project lead.

Maintainers will take into consideration if a patch is in line with the general principles of the project; meets the minimum standards for inclusion; and will judge the general consensus of contributors.

In general, all pull requests must:

  - Have a clear use case, fix a demonstrable bug or serve the greater good of the project (for example refactoring for modularisation);
  - Be well peer reviewed;
  - Follow code style guidelines;

Patches that change SCP consensus rules are considerably more involved than normal because they affect the entire ecosystem and so must be preceded by extensive discussions and clear detailing. While each case will be different, one should be prepared to expend more time and effort than for other kinds of patches because of increased peer review and consensus building requirements.

### Peer Review

Anyone may participate in peer review which is expressed by comments in the pull request. Typically reviewers will review the code for obvious errors, as well as test out the patchset and opine on the technical merits of the patch. Project maintainers take into account the peer review when determining if there is consensus to merge a pull request (remember that discussions may have been spread out over GitHub, email, and Discord discussions). 

Project maintainers reserve the right to weigh the opinions of peer reviewers using common sense judgement and also may weight based on meritocracy: Those that have demonstrated a deeper  commitment and understanding towards the project (over time) or have clear domain expertise may naturally have more weight, as one would expect in all walks of life.

Where a patchset affects consensus critical code, the bar will be set much higher in terms of discussion and peer review requirements, keeping in mind that mistakes could be very costly to the wider community. This includes refactoring of consensus critical code.

Where a patchset proposes to change the SCP consensus, it must have been discussed extensively on the forums and Discord, be accompanied by a widely discussed Proposal and have a generally widely perceived technical consensus of being a worthwhile change based on the judgement of the maintainers.

## Copyright

By contributing to this repository, you agree to license your work under the Mozilla Public License 2.0 unless specified otherwise at the top of the file itself. Any work contributed where you are not the original author must contain its license header with the original author(s) and source.