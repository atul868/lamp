window.onload = function() {
  const accessTokenId = window.localStorage.getItem('Authorization');
  const memberId = window.localStorage.getItem('memberId');

  if (accessTokenId && memberId) {
    $('#memberId').val(memberId);
    $('#accessTokenId').val(accessTokenId);
  }

  // Build a system
  const ui = SwaggerUIBundle({
    url: '/swagger',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: 'StandaloneLayout',
    validatorUrl: null,
    requestInterceptor: req => {
      const memberId = $('#memberId').val();
      const accessTokenId = $('#accessTokenId').val();

      if (memberId && accessTokenId) {
        req.headers.Authorization = accessTokenId;
        req.headers.id = memberId;
      }
      return req;
    },
    responseInterceptor: res => {
      if (res.url.indexOf('logout') != -1) {
        window.localStorage.removeItem('Authorization');
        window.localStorage.removeItem('memberId');

        $('#memberId').val('');
        $('#accessTokenId').val('');
      }

      if (res.status != 200) return;
      if (res.url.indexOf('Member/Login') != -1 || res.url.indexOf('Member/UserLogin') != -1) {
        if (res.body.memberId) {
          window.localStorage.setItem('Authorization', res.body.accessToken);
          window.localStorage.setItem('memberId', res.body.memberId);
          $('#memberId').val(res.body.memberId);
          $('#accessTokenId').val(res.body.accessToken);
        }
      }
      return res;
    }
  });

  window.ui = ui;

  $('#set-creds').click(() => {
    const memberId = $('#memberId').val();
    const accessTokenId = $('#accessTokenId').val();

    window.localStorage.setItem('Authorization', accessTokenId);
    window.localStorage.setItem('memberId', memberId);
  });
};
