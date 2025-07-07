
import LoginPage from '@pages/loginPage';
import { Page } from 'playwright';

export async function performLogin(page: Page, username: string, password: string): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.navigate('https://example.com/login');
  await loginPage.login(username, password);
}
