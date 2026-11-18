import { contactSentence, LegalPage } from '@/components/legal-page';
import { Config } from '@/lib/config';

export default function PrivacyScreen() {
  const us = Config.operatorName;
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 2026"
      intro={`This policy explains what information BuildBack collects, how it's used and the choices you have. BuildBack is run by ${us} ("we", "us"). We don't sell your information and we don't show ads that track you.`}
      sections={[
        {
          heading: 'What we collect',
          paragraphs: [
            'Account: your name, email address and password (stored securely, never readable by us).',
            'Profile: an optional profile photo.',
            'Location: the general area you choose, from a ZIP code or your device’s location, used to show what’s near you. We store a rounded point (about a mile) and a city name, never your street address. Device location is only used when you tap “Use my location”.',
            'What you post: businesses you list or nominate, photos, status updates, help requests, wishes, and reports.',
            'Activity: businesses you follow, people you block, and gifts you tell us about, including amounts if you enter them.',
            'Nominations: when someone nominates a business, they may give us that business’s public contact details (name, email, phone or social media). Only our review team sees these, and we use them only to invite the owner to claim the listing.',
          ],
        },
        {
          heading: 'What others can see',
          paragraphs: [
            'Business listings, approved help requests (first name and city, never an address), status updates, photos and wishes are public.',
            'Gift amounts you report are private to you. A business or neighbor chooses whether their page shows the total given, the number of supporters, both, or neither.',
            'Your email address, exact gifts, follows, blocks and reports are never shown to other members.',
          ],
        },
        {
          heading: 'How we use it',
          paragraphs: [
            'To run BuildBack: show nearby businesses and neighbors, count impact and badges, send account emails such as sign-up confirmations, review help requests, nominations and reports, and keep the community safe.',
          ],
        },
        {
          heading: 'Who we share it with',
          paragraphs: [
            'Service providers that run BuildBack for us: Supabase (database, sign-in and photo storage), Netlify (website hosting), Expo (app delivery and updates), our email provider (account emails) and Zippopotam.us (turns a ZIP code into a city; it receives only the ZIP code).',
            'When you give, you leave BuildBack for the recipient’s own payment or fundraising page. Their privacy policy applies there.',
            'We may share information if the law requires it, or to protect people from fraud or harm. We never sell your information.',
          ],
        },
        {
          heading: 'Keeping and deleting your information',
          paragraphs: [
            'We keep your information while your account is open. You can delete your account at any time from the Me tab (“Delete my account”). That permanently deletes your profile, photos, the businesses you listed, your help requests, wishes, follows, blocks and giving history.',
            'Reports you made may be kept without your name so we can keep the community safe.',
          ],
        },
        {
          heading: 'Children',
          paragraphs: ['BuildBack isn’t meant for children under 13, and we don’t knowingly collect their information.'],
        },
        {
          heading: 'Security',
          paragraphs: [
            'Your data is protected by encrypted connections and by database rules that limit who can see what. No system is perfect, so please use a strong, unique password.',
          ],
        },
        {
          heading: 'Changes and contact',
          paragraphs: [
            'We’ll update this policy as BuildBack grows, and let you know in the app about important changes.',
            `Questions or requests about your information? Please ${contactSentence()}.`,
          ],
        },
      ]}
    />
  );
}
