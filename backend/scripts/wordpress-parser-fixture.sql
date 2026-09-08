INSERT INTO `wp_posts` (`ID`, `post_title`, `post_content`) VALUES
(1, 'Hindi समाचार', 'Line one\nLine two, comma and \'quote\''),
(2, 'Doubled ''quote''', 'Text with ); inside');
INSERT INTO `wp_ignored` (`secret`) VALUES
('do not load');
INSERT INTO `wp_posts` (`ID`, `post_title`, `post_content`) VALUES
(3, 'Multiline', 'first
second');
