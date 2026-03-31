import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('retorna null quando não há access token', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('retorna null quando não há refresh token', () => {
    expect(service.getRefreshToken()).toBeNull();
  });

  it('salva e recupera access token', () => {
    service.save('acc123', 'ref456');
    expect(service.getAccessToken()).toBe('acc123');
  });

  it('salva e recupera refresh token', () => {
    service.save('acc123', 'ref456');
    expect(service.getRefreshToken()).toBe('ref456');
  });

  it('clear remove ambos os tokens', () => {
    service.save('acc123', 'ref456');
    service.clear();
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });
});
