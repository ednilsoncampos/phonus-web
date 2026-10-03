import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { EmpresaForm } from './empresa-form';
import { EmpresaService } from '../../../core/services/empresa.service';

const empresa = {
  nome: 'Loja',
  tipoDocumento: 'CNPJ' as const,
  documento: '11222333000181',
  endereco: null,
  telefone: null,
};

describe('EmpresaForm', () => {
  let service: EmpresaService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmpresaForm], providers: [provideAnimationsAsync()] });
    service = TestBed.inject(EmpresaService);
    vi.spyOn(service, 'buscar').mockReturnValue(of(empresa));
  });

  it('preenche o formulário com os dados da empresa', () => {
    const fixture = TestBed.createComponent(EmpresaForm);
    fixture.detectChanges();
    expect((fixture.componentInstance as any).form.value.nome).toBe('Loja');
  });

  it('envia vazio como null e não salva sem nome', () => {
    const atualizar = vi.spyOn(service, 'atualizar').mockReturnValue(of(empresa));
    const fixture = TestBed.createComponent(EmpresaForm);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.form.controls.nome.setValue('');
    comp.salvar();
    expect(atualizar).not.toHaveBeenCalled();

    comp.form.controls.nome.setValue(' Loja Nova ');
    comp.salvar();
    expect(atualizar).toHaveBeenCalledWith({ nome: 'Loja Nova', endereco: null, telefone: null });
  });
});
