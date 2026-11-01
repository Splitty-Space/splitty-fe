# Agent skills

The skills in this folder are a copy of Matt Pocock's skills
(https://github.com/mattpocock/skills, MIT, see `LICENSE-mattpocock-skills`).
They are the 27 skills that the `mattpocock-skills` plugin ships, version 1.3.2,
commit `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`.

They live in the repo so that every Claude Code session with this repo has them,
including cloud sessions where the plugin is not installed. Don't install the plugin
on top of them: you would get every skill twice.

Repo-specific config for these skills is in `AGENTS.md` ("Agent skills") and `docs/agents/`.

## Updating

Copy the folders listed in `.claude-plugin/plugin.json` of a newer upstream commit over
these, then update the version and commit above.
