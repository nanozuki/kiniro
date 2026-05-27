return {
  settings = {
    vtsls = {
      autoUseWorkspaceTsdk = true,
      tsserver = {
        globalPlugins = {
          {
            name = "typescript-svelte-plugin",
            location = vim.fn.getcwd() .. "/node_modules",
            enableForWorkspaceTypeScriptVersions = true,
          },
        },
      },
    },
  },
}
