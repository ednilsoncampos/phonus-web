import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RegisterComponent } from './register.component';

const termosMock = {
  id: 'termos-1',
  versao: '1.0',
  titulo: 'Termos de Uso',
  conteudo: 'Conteúdo dos termos',
  declaracaoAceite: 'Li e aceito os termos',
  ativo: true,
};

const CNPJ_VALIDO = '11222333000181';

describe('RegisterComponent', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  function criar() {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    return { fixture, comp };
  }

  function carregarTermos() {
    httpMock.expectOne((r) => r.url.endsWith('/termos/atual')).flush(termosMock);
  }

  function preencherValido(comp: any) {
    comp.form.setValue({
      nomeEmpresa: '  Padaria do João ',
      tipoDocumento: 'CNPJ',
      documento: '11.222.333/0001-81',
      nome: 'João da Silva',
      email: 'joao@padaria.com.br',
      senha: 'senha1234',
      confirmaSenha: 'senha1234',
      aceite: true,
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  it('busca os termos vigentes ao abrir', () => {
    const { comp } = criar();
    expect(comp.carregandoTermos()).toBe(true);

    carregarTermos();

    expect(comp.termos()).toEqual(termosMock);
    expect(comp.carregandoTermos()).toBe(false);
    expect(comp.termosErro()).toBe(false);
  });

  it('sinaliza erro quando os termos não carregam e não permite cadastrar', () => {
    const { comp } = criar();

    httpMock
      .expectOne((r) => r.url.endsWith('/termos/atual'))
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(comp.termosErro()).toBe(true);
    preencherValido(comp);
    comp.submit();
    httpMock.expectNone((r) => r.url.endsWith('/auth/registro'));
  });

  it('não chama a API com formulário inválido e marca os campos como tocados', () => {
    const { comp } = criar();
    carregarTermos();

    comp.submit();

    httpMock.expectNone((r) => r.url.endsWith('/auth/registro'));
    expect(comp.form.controls.nomeEmpresa.touched).toBe(true);
  });

  it('exige o aceite dos termos', () => {
    const { comp } = criar();
    carregarTermos();
    preencherValido(comp);
    comp.form.controls.aceite.setValue(false);

    comp.submit();

    httpMock.expectNone((r) => r.url.endsWith('/auth/registro'));
  });

  it('rejeita CNPJ com dígito verificador inválido', () => {
    const { comp } = criar();
    carregarTermos();
    preencherValido(comp);
    comp.form.controls.documento.setValue('11222333000182');

    expect(comp.form.controls.documento.hasError('documentoInvalido')).toBe(true);
    expect(comp.form.invalid).toBe(true);
  });

  it('trocar o tipo de documento limpa o campo documento', () => {
    const { comp } = criar();
    carregarTermos();
    comp.form.controls.documento.setValue(CNPJ_VALIDO);

    comp.form.controls.tipoDocumento.setValue('CPF');

    expect(comp.form.controls.documento.value).toBe('');
  });

  it('rejeita senhas diferentes', () => {
    const { comp } = criar();
    carregarTermos();
    preencherValido(comp);
    comp.form.controls.confirmaSenha.setValue('outra1234');

    expect(comp.form.hasError('senhasDiferentes')).toBe(true);
    comp.submit();
    httpMock.expectNone((r) => r.url.endsWith('/auth/registro'));
  });

  it('rejeita senha igual ao e-mail, inclusive quando o e-mail muda depois', () => {
    const { comp } = criar();
    carregarTermos();
    preencherValido(comp);
    comp.form.controls.senha.setValue('joao1234@x.com');
    expect(comp.form.controls.senha.hasError('senhaIgualEmail')).toBe(false);

    comp.form.controls.email.setValue('JOAO1234@x.com');

    expect(comp.form.controls.senha.hasError('senhaIgualEmail')).toBe(true);
  });

  it('rejeita senha sem número', () => {
    const { comp } = criar();
    carregarTermos();
    comp.form.controls.senha.setValue('somenteletras');

    expect(comp.form.controls.senha.hasError('senhaFraca')).toBe(true);
  });

  it('envia POST /auth/registro com documento só em dígitos e termosId, e vai para verifique-email', () => {
    const { comp } = criar();
    carregarTermos();
    preencherValido(comp);

    comp.submit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/registro') && r.method === 'POST');
    expect(req.request.body).toEqual({
      nomeEmpresa: 'Padaria do João',
      tipoDocumento: 'CNPJ',
      documento: CNPJ_VALIDO,
      nome: 'João da Silva',
      email: 'joao@padaria.com.br',
      senha: 'senha1234',
      termosId: 'termos-1',
    });
    req.flush({}, { status: 201, statusText: 'Created' });

    expect(router.navigate).toHaveBeenCalledWith(['/verifique-email'], {
      state: { email: 'joao@padaria.com.br' },
    });
  });

  it('exibe a mensagem do backend em caso de 409', () => {
    const { comp } = criar();
    carregarTermos();
    preencherValido(comp);

    comp.submit();
    httpMock
      .expectOne((r) => r.url.endsWith('/auth/registro'))
      .flush({ message: 'E-mail já cadastrado.' }, { status: 409, statusText: 'Conflict' });

    expect(comp.errorMessage()).toBe('E-mail já cadastrado.');
    expect(comp.isLoading()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('usa mensagem padrão em 409 sem corpo e mensagem genérica em falha inesperada', () => {
    const { comp } = criar();
    carregarTermos();
    preencherValido(comp);

    comp.submit();
    httpMock
      .expectOne((r) => r.url.endsWith('/auth/registro'))
      .flush(null, { status: 409, statusText: 'Conflict' });
    expect(comp.errorMessage()).toBe('E-mail já cadastrado.');

    comp.submit();
    httpMock
      .expectOne((r) => r.url.endsWith('/auth/registro'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.errorMessage()).toBe('Não foi possível concluir o cadastro. Tente novamente.');
  });
});
