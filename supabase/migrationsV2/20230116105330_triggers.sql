CREATE TRIGGER on_auth_user_created_create_profile
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_auth_user_created();