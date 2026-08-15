// dsh-multi-workspace — Client half
// Registers a tab in Settings → Plugins showing all workspaces and their
// writable status.

export default {
  apply(ctx) {
    var slots = ctx.get('slots');
    if (slots === void 0) return;

    slots.inject('settings.plugins.tab', function() {
      return slots.register(
        { name: 'settings.plugins.tab', id: 'multi-workspace', order: 30, label: '工作区权限' },
        function() { return React.createElement(WorkspacePanel, null); }
      );
    });
  }
};

function WorkspacePanel() {
  var state = React.useState({
    loading: true,
    error: null,
    workspaceRoot: '',
    workspaces: []
  });
  var setState = state[1];
  var s = state[0];

  React.useEffect(function() {
    host.call('getWorkspaces').then(function(result) {
      setState(function(prev) {
        return Object.assign({}, prev, {
          loading: false,
          workspaceRoot: result.workspaceRoot,
          workspaces: result.workspaces
        });
      });
    }).catch(function(err) {
      setState(function(prev) {
        return Object.assign({}, prev, { loading: false, error: String(err) });
      });
    });
  }, []);

  return React.createElement('div', { style: { padding: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' } },
    React.createElement('h2', { style: { margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 } }, '多工作区文件权限'),
    React.createElement('p', { style: { margin: '0 0 16px 0', fontSize: '13px', color: '#666' } },
      '所有已注册的工作区目录自动获得文件写入权限。在 UI 中添加新工作区后无需任何配置即可写入。'
    ),
    s.error
      ? React.createElement('div', { style: { background: '#fff0f0', border: '1px solid #fcc', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', color: '#c00', fontSize: '13px' } }, s.error)
      : null,
    s.loading
      ? React.createElement('div', { style: { textAlign: 'center', padding: '24px', color: '#888' } }, '加载中...')
      : null,
    s.loading ? null : React.createElement('div', null,
      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('div', { style: { fontSize: '12px', color: '#888', marginBottom: '4px' } }, '主工作区'),
        React.createElement('code', { style: { background: '#f5f5f5', borderRadius: '4px', padding: '4px 8px', fontSize: '13px' } }, s.workspaceRoot)
      ),
      s.workspaces.length === 0
        ? React.createElement('div', { style: { padding: '12px', textAlign: 'center', color: '#999' } }, '暂无工作区')
        : React.createElement('div', { style: { border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' } },
            s.workspaces.map(function(w) {
              return React.createElement('div', {
                key: w.id,
                style: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }
              },
                React.createElement('span', {
                  style: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: w.writable ? '#22c55e' : '#ef4444', flexShrink: 0, marginRight: '10px' }
                }),
                React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                  React.createElement('div', { style: { fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, w.title || '(untitled)'),
                  React.createElement('div', { style: { fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, w.path)
                ),
                React.createElement('span', {
                  style: { display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 500, color: '#fff', background: w.writable ? '#22c55e' : '#ef4444', flexShrink: 0 }
                }, w.writable ? '可写入' : '不可写入')
              );
            })
          )
    )
  );
}