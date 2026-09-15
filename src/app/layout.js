import './globals.css';
import { CartProvider } from '@/components/CartContext';
export const metadata = {
  title: 'Custom Car Trays | Personalized Steering Wheel Trays',
  description: 'Create a personalized steering-wheel car tray for eating, working and life on the road. Premium acrylic, 3/8" thick, made to order.',
  openGraph: {
    title: 'Custom Car Trays | Personalized Steering Wheel Trays',
    description: 'Design your own custom car tray. Upload a photo or generate AI art.',
    url: 'https://www.customcartrays.com',
    siteName: 'Custom Car Trays',
    type: 'website',
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><CartProvider>{children}</CartProvider></body>
    </html>
  );
}
