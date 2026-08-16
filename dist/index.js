// dsh-multi-workspace — Host half
// Injects ALL registered workspace paths into the sandbox policy so every
// workspace directory is automatically writable by the fs tools.
//
// Two layers of protection:
//   1. wrap sandboxPolicy.resolve() → always attaches additionalWorkspaceRoots
//   2. wrap fs.writeText / fs.editText → fallback retry on each extra root
//
// Layer 2 ensures this plugin works EVEN on DSH installations whose
// dsh-sandbox or dsh-sandbox-policy source files have NOT been patched.

export default {
  inject: ['sandboxPolicy', 'workspaceRegistry', 'fs'],
  apply(ctx) {
    var registry = ctx.workspaceRegistry;
    var policy = ctx.sandboxPolicy;
    var fs = ctx.fs;

    // ── 1. Wrap resolve() ───────────────────────────────────────────────
    var origResolve = policy.resolve.bind(policy);
    policy.resolve = function(request) {
      var result = origResolve(request);
      var copy = Object.create(result);
      var extra = Array.isArray(copy.additionalWorkspaceRoots)
        ? copy.additionalWorkspaceRoots.slice()
        : [];
      var wsRoot = copy.workspaceRoot;
      try {
        var workspaces = registry.list();
        for (var i = 0; i < workspaces.length; i++) {
          var w = workspaces[i];
          if (w && w.path && w.path !== wsRoot && extra.indexOf(w.path) === -1) {
            extra.push(w.path);
          }
        }
      } catch (_) { /* registry not ready yet */ }
      copy.additionalWorkspaceRoots = extra;
      return copy;
    };

    // ── 2. Wrap fs.writeText ────────────────────────────────────────────
    var origWriteText = fs.writeText.bind(fs);
    fs.writeText = async function(target, content, expected, signal, sp) {
      try {
        return await origWriteText(target, content, expected, signal, sp);
      } catch (e) {
        if (!e || e.code !== 'FS_SANDBOX_DENIED') throw e;
      }
      var effectivePolicy = sp || policy.resolve();
      var roots = effectivePolicy.additionalWorkspaceRoots || [];
      for (var i = 0; i < roots.length; i++) {
        try {
          return await origWriteText(target, content, expected, signal, {
            mode: 'workspace-write',
            workspaceRoot: roots[i]
          });
        } catch (e2) {
          if (!e2 || e2.code !== 'FS_SANDBOX_DENIED') throw e2;
        }
      }
      throw Object.assign(
        new Error('FS_SANDBOX_DENIED after all fallbacks'),
        { code: 'FS_SANDBOX_DENIED' }
      );
    };

    // ── 3. Wrap fs.editText ─────────────────────────────────────────────
    var origEditText = fs.editText.bind(fs);
    fs.editText = async function(target, edit, expected, signal, sp) {
      try {
        return await origEditText(target, edit, expected, signal, sp);
      } catch (e) {
        if (!e || e.code !== 'FS_SANDBOX_DENIED') throw e;
      }
      var effectivePolicy = sp || policy.resolve();
      var roots = effectivePolicy.additionalWorkspaceRoots || [];
      for (var i = 0; i < roots.length; i++) {
        try {
          return await origEditText(target, edit, expected, signal, {
            mode: 'workspace-write',
            workspaceRoot: roots[i]
          });
        } catch (e2) {
          if (!e2 || e2.code !== 'FS_SANDBOX_DENIED') throw e2;
        }
      }
      throw Object.assign(
        new Error('FS_SANDBOX_DENIED after all fallbacks'),
        { code: 'FS_SANDBOX_DENIED' }
      );
    };

    // ── Cleanup ─────────────────────────────────────────────────────────
    ctx.effect(function() {
      return function() {
        policy.resolve = origResolve;
        fs.writeText = origWriteText;
        fs.editText = origEditText;
      };
    });
  }
};