import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { CrmFields, isValidCrm } from '../CrmFields';

function Form() {
  const [value, setValue] = useState('12345/SP');
  return <CrmFields value={value} onChange={setValue} />;
}
it('carrega CRM e UF separados e permite buscar estado sem acentos', () => {
  const screen = render(<Form />);
  expect(screen.getByLabelText('CRM *').props.value).toBe('12345');
  expect(screen.getByText('SP').props.children).toBe('SP');
  fireEvent.press(screen.getByLabelText('UF *'));
  fireEvent.changeText(screen.getByLabelText('Buscar por sigla ou estado'), 'espirito');
  expect(screen.queryByText('SP — São Paulo')).toBeNull();
  fireEvent.press(screen.getByText('ES — Espírito Santo'));
  expect(screen.getByText('ES').props.children).toBe('ES');
  expect(screen.getByLabelText('CRM *').props.value).toBe('12345');
});
it('aceita somente UFs existentes', () => {
  expect(isValidCrm('12345/SP')).toBe(true);
  expect(isValidCrm('12345/DF')).toBe(true);
  expect(isValidCrm('12345/ZZ')).toBe(false);
  expect(isValidCrm('12345/')).toBe(false);
});
